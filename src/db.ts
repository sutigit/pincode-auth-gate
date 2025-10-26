import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import type { Database } from "./types/database.types.js";
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient<Database>(supabaseUrl!, supabaseKey!);

export async function getApps() {
  let { data: appNames, error } = await supabase
    .from("pincodes")
    .select("app_name");

  if (error) return [];

  return appNames?.map((item) => item.app_name);
}
