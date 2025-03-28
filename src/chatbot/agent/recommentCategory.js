import { zodResponseFormat } from "openai/helpers/zod.mjs";
import { callAI } from "./utils";
import { z } from "zod";

const fs = require("fs");

function generateSystemPrompt(categoryList) {
    return `
    \"\"\" 
    Bạn đóng vai một chatbot gợi ý sản phẩm cho một trang thương mại điện tử. Dựa trên danh mục sản phẩm được cung cấp, bạn sẽ phân tích yêu cầu của người dùng và đề xuất danh mục phù hợp nhất.
    
    Đầu ra của bạn phải ở định dạng JSON có cấu trúc như sau. Hãy đảm bảo tuân thủ đúng định dạng chỉ cần trả về kết quả như dưới không cần giải thích gì thêm:
    {
      "decision": "<mã danh mục>", Chọn một hoặc nhiều mã danh mục từ danh sách rồi ghi vào mảng.
      "message": ""
    }

    Danh mục sản phẩm có sẵn (mã ID - mô tả):
    ${Object.entries(categoryList).map(([id, name]) => `${id} - ${name}`).join("\n    ")}
    \"\"\"`;
}

const RecommentCategoryFormat = z.object({
    decision: z.array(z.number()),
    message: z.string(),
});

const recommentCategoryAgent = async (preData, message, recommentId) => {
    // Read the JSON file
    let systemPrompt = ''
    const rawData = fs.readFileSync(`src/data/list_menu.json`, 'utf-8');
    const listMenu = JSON.parse(rawData);
    let categories = {}

    for (const menu of listMenu) {
        const linkParts = menu.link.split("/");
        const urlKey = linkParts[linkParts.length - 2];
        const categoryId = parseInt(menu.link.split("/").pop().replace("c", ""), 10);

        if (recommentId === categoryId) {
            const rawData = fs.readFileSync(`src/data/products/${urlKey}/categoryList.json`, 'utf-8');
            const categoryList = JSON.parse(rawData);
            categories = {
                ...categories,
                ...categoryList,

            }
        }
    }

    systemPrompt = generateSystemPrompt(categories)

    const data = [
        ...preData,
        {
            role: "assistant",
            content: systemPrompt,
        },
        {
            role: "user",
            content: message,
        }
    ]

    const responseFormat = zodResponseFormat(RecommentCategoryFormat, "schemaName")
    const results = await callAI(data, responseFormat)

    return results
}

export default recommentCategoryAgent