import type { NextApiRequest, NextApiResponse } from "next";

import { type PipelineNode } from "@/types";
import fs from "fs";
import path from "path";

function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Ensure it's a GET request
    if (req.method !== "GET") {
      res.status(405).end(); // Method Not Allowed
      return;
    }

    const filePath = path.join(process.cwd(), "pipeline-flows.json");

    console.log("filePath", filePath);

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    const fileContent = fs.readFileSync(filePath, "utf8");

    const pipelineTopologyData: PipelineNode[] = JSON.parse(
      fileContent,
    ) as PipelineNode[];

    const data = pipelineTopologyData.filter((node) => {
      return node.pipelineID === req.query.id;
    });

    res.status(200).json([...data]);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
}

export default handler;
