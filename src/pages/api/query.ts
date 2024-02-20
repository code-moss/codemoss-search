import { Readable } from "stream";
import SerperApi from "../utils/serper.api";
import OpenAI from "openai";

function transformString(str) {
  let lines = str.split("\n");
  let result = lines.map((line) => ({ question: line }));
  return result;
}

export default async function handler(req, res) {
  // 第一步：将用户问题请求网络API拿到网络数据
  const { query, rid } = req.body;
  const serperData = await SerperApi(query);

  // 创建一个Readable流（流对象）
  const readable = new Readable({
    read() {},
  });

  readable.push(
    `{"query": "${query}", "rid": "${rid}", "contexts": ${JSON.stringify(serperData)}}` +
      "\n\n__LLM_RESPONSE__\n\n",
  );

  // 第二步：将网络数据给OpenAI，使其回答内容
  const openai = new OpenAI({
    apiKey: process.env.API_KEY, // This is the default and can be omitted
    baseURL: process.env.BASE_URL,
  });

  const stream = await openai.chat.completions.create({
    model: process.env.CHAT_MODEL,
    messages: [
      {
        role: "system",
        content: `You are a large language AI assistant built by CodeMoss AI. You are given a user question, and please write clean, concise and accurate answer to the question. You will be given a set of related contexts to the question, each starting with a reference number like [[citation:x]], where x is a number. Please use the context and cite the context at the end of each sentence if applicable.

Your answer must be correct, accurate and written by an expert using an unbiased and professional tone. Please limit to 1024 tokens. Do not give any information that is not related to the question, and do not repeat. Say "information is missing on" followed by the related topic, if the given context do not provide sufficient information.

Please cite the contexts with the reference numbers, in the format [citation:x]. If a sentence comes from multiple contexts, please list all applicable citations, like [citation:3][citation:5]. Other than code and specific names and citations, your answer must be written in the same language as the question.

Here are the set of contexts:

${serperData.map((c) => c.snippet).join("\n\n")}

Remember, don't blindly repeat the contexts verbatim. And here is the user question: \n\n`,
      },
      { role: "user", content: query },
    ],
    stream: true,
  });

  // 疑问：这里为啥不流式触发？
  for await (const chunk of stream) {
    readable.push(chunk.choices[0]?.delta?.content || "");
  }

  //   第三步：猜你想问
  const chatCompletion = await openai.chat.completions.create({
    model: process.env.CHAT_MODEL,
    messages: [
      {
        role: "system",
        content: `You are a helpful assistant that helps the user to ask related questions, based on user's original question and the related contexts. Please identify worthwhile topics that can be follow-ups, and write questions no longer than 20 words each. Please make sure that specifics, like events, names, locations, are included in follow up questions so they can be asked standalone. For example, if the original question asks about "the Manhattan project", in the follow up question, do not just say "the project", but use the full name "the Manhattan project". Your related questions must be in the same language as the original question.
        
        Here are the contexts of the question:
        
        ${serperData.map((c) => c.snippet).join("\n\n")}
        
        Remember, based on the original question and related contexts, suggest three such further questions. Do NOT repeat the original question. Each related question should be no longer than 20 words. Here is the original question:
        `,
      },
      { role: "user", content: query },
    ],
  });

  console.log(transformString(chatCompletion.choices[0].message.content));

  readable.push("\n\n__RELATED_QUESTIONS__\n\n");
  readable.push(
    JSON.stringify(transformString(chatCompletion.choices[0].message.content)),
  );

  readable.push(null); // 表示流的结束

  // 设置响应头
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Transfer-Encoding", "chunked");

  // 将Readable流的内容管道到响应对象
  readable.pipe(res);
}
