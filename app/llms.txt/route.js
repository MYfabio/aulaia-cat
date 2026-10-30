import { llmsResum, respostaText } from "../../lib/llms";

export const dynamic = "force-static";

export function GET() {
  return respostaText(llmsResum());
}
