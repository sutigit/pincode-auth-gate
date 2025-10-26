import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import type { Database } from "./types/database.types.js";
import { generatePincode } from "./utils.js";
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient<Database>(supabaseUrl!, supabaseKey!);

export async function getApps() {
  let { data, error } = await supabase.from("pincodes").select("app_name");

  if (error) return [];

  return data?.map((ent) => ent.app_name);
}

export async function createPincode(appName: string) {
  const { data, error } = await supabase
    .from("pincodes")
    .insert([
      {
        app_name: appName,
        pincode: generatePincode(),
      },
    ])
    .select();

  if (error) return [];

  return data;
}

export async function updatePincode(appName: string) {
  const { data, error } = await supabase
    .from("pincodes")
    .update({ pincode: generatePincode() })
    .eq("app_name", appName)
    .select();

  if (error) return [];

  return data;
}
