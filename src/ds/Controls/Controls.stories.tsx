import type { Meta, StoryObj } from "@storybook/react-vite";
import { CircleMinus } from "@/lib/icons";
import { Button, Field, IconButton, Input, LinkAction, Select, Textarea } from "./Controls";
import { controlCopy } from "./Controls.fixtures";

const meta: Meta = { title: "Catalogue/Contrôles", tags: ["a-valider"] };
export default meta;
type Story = StoryObj;

export const EntryAndValidation: Story = {
  render: (_args, { globals: { lang } }) => {
    const copy = controlCopy[lang === "en" ? "en" : "fr"];
    return <>
      <Field label={copy.name}><Input defaultValue="Notion" readOnly /></Field>
      <Field label={copy.description}><Textarea defaultValue={copy.descriptionValue} rows={3} /></Field>
      <Field label={copy.billing}><Select defaultValue="monthly">
        <option value="monthly">{copy.monthly}</option>
        <option value="yearly">{copy.annual}</option>
      </Select></Field>
      <Field label={copy.source} help={copy.help} error={copy.error}>
        <Input defaultValue="notion.com/pricing" type="url" />
      </Field>
    </>;
  },
};

export const Actions: Story = {
  render: (_args, { globals: { lang } }) => {
    const copy = controlCopy[lang === "en" ? "en" : "fr"];
    return <div>
      <Button variant="primary">{copy.submit}</Button>{" "}
      <Button disabled>{copy.cancel}</Button>{" "}
      <IconButton aria-label={copy.remove} variant="quiet" size="compact" icon={<CircleMinus />} />{" "}
      <Button size="compact">{copy.undo}</Button>{" "}
      <Button variant="danger">{copy.delete}</Button>{" "}
      <Button loading>{copy.saving}</Button>{" "}
      <LinkAction href={`/${lang}/tool/notion`}>{copy.compare}</LinkAction>
    </div>;
  },
};
