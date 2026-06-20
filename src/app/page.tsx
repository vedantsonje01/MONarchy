// Root page -- redirects to the static HTML frontend served from /public/index.html
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/index.html");
}
