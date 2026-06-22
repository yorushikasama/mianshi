"use client";

import { useState } from "react";
import { Button } from "@/components/ui/shiny-button";
import { Toolbar } from "@/components/ui/toolbar";

export function ReviewActions() {
  const [message, setMessage] = useState("");

  return (
    <div className="grid gap-3">
      <Toolbar>
        <Button onClick={() => setMessage("已标记掌握")} type="button">标记掌握</Button>
        <Button onClick={() => setMessage("已加入错题")} type="button">加入错题</Button>
        <Button onClick={() => setMessage("已安排下次复习")} type="button">下次复习</Button>
      </Toolbar>
      {message ? <p className="m-0 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2.5 font-bold text-emerald-700">{message}</p> : null}
    </div>
  );
}
