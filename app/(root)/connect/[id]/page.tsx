import { auth } from "@/auth";
import { client } from "@/sanity/lib/client";
import { STARTUP_BY_ID_QUERY } from "@/sanity/lib/queries";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";

export default async function ConnectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = (await params).id;
  const session = await auth();

  if (!session || !session.linkedinVerified) {
    redirect(`/startup/${id}`);
  }

  const startup = await client.fetch(STARTUP_BY_ID_QUERY, { id });

  if (!startup) {
    redirect("/startups");
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">
        Connect with {startup.author.name}
      </h1>
      <form
        action={async (formData: FormData) => {
          "use server";
          const message = formData.get("message")?.toString();

          if (!message || message.length < 10) {
            redirect(
              `/connect/${id}?error=Message must be at least 10 characters`
            );
          }

          const res = await fetch(
            `${process.env.NEXTAUTH_URL}/api/send-email`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                to: startup.author.email,
                from: session.user.email,
                message,
                subject: `New Connection Request for ${startup.title}`,
              }),
            }
          );

          if (res.ok) {
            redirect(`/startup/${id}?success=Message sent successfully`);
          } else {
            redirect(`/connect/${id}?error=Failed to send message`);
          }
        }}
        className="space-y-4"
      >
        <div>
          <label htmlFor="message" className="block text-sm font-medium">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            className="w-full p-2 border rounded"
            rows={5}
            required
            minLength={10}
            placeholder="Write your message to the author..."
          />
        </div>
        <Button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Send Message
        </Button>
      </form>
    </div>
  );
}
