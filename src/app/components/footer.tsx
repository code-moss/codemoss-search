import { FC } from "react";

export const Footer: FC = () => {
  return (
    <div className="text-center flex flex-col items-center text-xs text-zinc-700 gap-1">
      <div className="text-zinc-400">
        注意：本项目基于ChatGPT和谷歌搜索，不一定完全正确，请自行甄别
      </div>
    </div>
  );
};
