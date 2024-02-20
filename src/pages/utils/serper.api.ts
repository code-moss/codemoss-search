import axios from "axios";

async function SerperApi(query) {
  if (!query) return "";
  let data = JSON.stringify({
    q: query,
    gl: "cn",
    hl: "zh-cn",
  });

  let config = {
    method: "post",
    url: "https://google.serper.dev/search",
    headers: {
      "X-API-KEY": process.env.SERPER_API_KEY,
      "Content-Type": "application/json",
    },
    data: data,
  };

  const res = await axios(config);
  return res.data.organic;
}

export default SerperApi;
