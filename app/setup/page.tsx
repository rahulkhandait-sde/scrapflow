import { setupUser } from "@/actions/billings";

async function SetupPage() {
  return await setupUser();
}

export default SetupPage;
