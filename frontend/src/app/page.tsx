"use client";
import { Button } from "@/components/ui/button";
import { CoolMode } from "@/components/ui/cool-mode";
export default function Home() {
  return (
    <div className="h-screen font-bold text-4xl gap-4 w-screen flex flex-col justify-center items-center">
      Hi Guys
      <CoolMode>
        <Button>Lets Go, Click Me!</Button>
      </CoolMode>
    </div>
  );
}
