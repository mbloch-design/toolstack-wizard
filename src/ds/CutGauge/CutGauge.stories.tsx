import type { Meta, StoryObj } from "@storybook/react-vite";
import CutGauge from "./CutGauge";
import { formatAmount } from "@/lib/currencyRates";

const meta: Meta<typeof CutGauge> = { title: "Molécules/Jauge de coupe", component: CutGauge, tags: ["a-valider"], decorators: [(Story) => <div style={{ maxWidth: 520 }}><Story /></div>] };
export default meta;
type Story = StoryObj<typeof CutGauge>;

const gauge = (kept: number, cut: number, action = true): Story => ({
  render: (_args, context) => <CutGauge lang={context.globals.lang} kept={kept} cut={cut} format={(n) => formatAmount(n, "EUR", context.globals.lang)} onReview={action ? () => {} : undefined} />,
});

export const Half = gauge(50, 50);
export const SmallCut = gauge(180, 9);
export const LargeCut = gauge(12, 96);
export const WithoutAction = gauge(63, 24, false);
