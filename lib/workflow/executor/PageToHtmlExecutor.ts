import { ExecutionEnviornment } from "@/lib/types";
import { PageToHtmlTask } from "../task/PageToHtml";

export async function PageToHtmlExecutor(
  enviornment: ExecutionEnviornment<typeof PageToHtmlTask>
): Promise<boolean> {
  try {
    const html = await enviornment.getPage()!.content();
    enviornment.setOutput("HTML", html);
    return true;
  } catch (error: any) {
    enviornment.log.error(error.message);
    return false;
  }
}
