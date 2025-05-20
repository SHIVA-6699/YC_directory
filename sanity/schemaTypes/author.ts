import { defineType } from "sanity";

export const author = defineType({
  name: "author",
  title: "Author",
  type: "document",
  fields: [
    {
      name: "id",
      title: "GitHub ID",
      type: "string",
    },
    {
      name: "linkedinId",
      title: "LinkedIn ID",
      type: "string",
    },
    {
      name: "name",
      title: "Name",
      type: "string",
    },
    {
      name: "username",
      title: "Username",
      type: "string",
    },
    {
      name: "email",
      title: "Email",
      type: "string",
    },
    {
      name: "image",
      title: "Image",
      type: "string",
    },
    {
      name: "bio",
      title: "Bio",
      type: "text",
    },
    {
      name: "linkedinVerified",
      title: "Is LinkedIn Verified",
      type: "boolean",
      initialValue: false,
    },
    {
      name: "linkedinProfile",
      title: "LinkedIn Profile URL",
      type: "url",
    },
  ],
});
