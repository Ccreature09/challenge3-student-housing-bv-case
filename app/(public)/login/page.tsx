import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export default function page() {
  return (
    <div className="flex min-h-screen flex-col items-center bg-white-400 font-bold text-black">
      <header className="flex flex-col items-center gap-2 pt-6">
        <img
          src="/images/lightlogo.png"
          alt="logo"
          width="800"
          height="600"
        />
        <p className="mb-25">Your ideal Housing Management Platform</p>
      </header>
      <main className="flex flex-col items-center justify-center gap-5">
        <Label htmlFor="email">Username</Label>
        <Input
          aria-label="First text box"
          className="w-[10cm] rounded border border-gray-400 px-2 py-1 font-normal"
          type="text"
        />
        <Label htmlFor="password">Password</Label>
        <Input
          aria-label="Second text box"
          className="w-[10cm] rounded border border-gray-400 px-2 py-1 font-normal"
          type="password"
        />
      </main>

      <Button className="w-[5cm] bg-blue-500 text-white hover:bg-blue-600 mt-5">
        Login
      </Button>
    </div>
  )
}
