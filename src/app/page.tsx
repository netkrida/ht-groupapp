import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
          HT <span className="text-[hsl(280,100%,70%)]">Group</span> App
        </h1>
        <p className="text-xl text-white/80">
          Welcome to HT Group Application Management System
        </p>
        <div className="flex gap-4">
          <Link href="/auth">
            <Button size="lg" className="font-semibold">
              Login to Continue
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
