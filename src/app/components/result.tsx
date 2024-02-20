"use client";
import { Answer } from "@/app/components/answer";
import { Relates } from "@/app/components/relates";
import { Sources } from "@/app/components/sources";
import { Relate } from "@/app/interfaces/relate";
import { Source } from "@/app/interfaces/source";
import { parseStreaming } from "@/app/utils/parse-streaming";
import { Annoyed } from "lucide-react";
import { FC, useEffect, useState } from "react";

export const Result: FC<{ query: string; rid: string }> = ({ query, rid }) => {
  const [sources, setSources] = useState<Source[]>([]);
  const [markdown, setMarkdown] = useState<string>("");
  const [relates, setRelates] = useState<Relate[] | null>(null);
  const [error, setError] = useState<number | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    void parseStreaming(
      controller,
      query,
      rid,
      setSources,
      setMarkdown,
      setRelates,
      setError,
    );
    return () => {
      controller.abort();
    };
  }, [query]);
  return (
    <div className="flex flex-col gap-8">
      <Answer markdown={markdown} sources={sources}></Answer>
      <Sources sources={sources}></Sources>
      <Relates relates={relates}></Relates>
      {error && (
        <div className="absolute inset-4 flex items-center justify-center bg-white/40 backdrop-blur-sm">
          <div className="p-4 bg-white shadow-2xl rounded text-blue-500 font-medium flex gap-4">
            <Annoyed></Annoyed>
            {error === 429
              ? "很抱歉，您最近提出的请求太多，请稍后再试。"
              : "抱歉，遇到未知问题（可以检查一下自己的key是否设置正确）"}
          </div>
        </div>
      )}
    </div>
  );
};
