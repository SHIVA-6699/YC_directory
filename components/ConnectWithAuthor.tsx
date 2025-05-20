import { auth, signIn } from "@/auth";
import { Button } from "./ui/button";
import { Linkedin } from "lucide-react";
import { redirect } from "next/navigation";

interface ConnectWithAuthorProps {
  authorId: string;
  currentUserId?: string;
  id: string;
}

const ConnectWithAuthor = async ({
  authorId,
  currentUserId,
  id,
}: ConnectWithAuthorProps) => {
  const session = await auth();

  if (currentUserId === authorId) {
    return null;
  }

  if (!session) {
    return (
      <form
        action={async () => {
          "use server";
          await signIn("github", { redirectTo: `/startup/${id}` });
        }}
      >
        <Button
          type="submit"
          className="bg-primary hover:bg-primary/90 text-white"
        >
          Login to Connect
        </Button>
      </form>
    );
  }

  if (!session.linkedinVerified) {
    return (
      <form
        action={async () => {
          "use server";
          await signIn("linkedin", { redirectTo: `/startup/${id}` });
        }}
      >
        <Button
          type="submit"
          className="bg-[#0077B5] hover:bg-[#0077B5]/90 text-white"
        >
          <Linkedin className="mr-2 h-4 w-4" />
          Verify with LinkedIn
        </Button>
      </form>
    );
  }

  return (
    <form
      action={async () => {
        "use server";
        redirect(`/connect/${id}`);
      }}
    >
      <Button
        type="submit"
        className="bg-primary hover:bg-primary/90 text-white"
      >
        Connect with Author
      </Button>
    </form>
  );
};

export default ConnectWithAuthor;
