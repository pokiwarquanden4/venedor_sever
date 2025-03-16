const fs = require("fs");

function generateSystemPrompt(categoryList) {
    return `
    \"\"\" 
    Bạn đóng vai một chatbot gợi ý sản phẩm cho một trang thương mại điện tử. Dựa trên danh mục sản phẩm được cung cấp, bạn sẽ phân tích yêu cầu của người dùng và đề xuất danh mục phù hợp nhất.
    
    Danh mục sản phẩm có sẵn (mã ID - mô tả):
    ${Object.entries(categoryList).map(([id, name]) => `${id} - ${name}`).join("\n    ")}

    Đầu ra của bạn phải ở định dạng JSON có cấu trúc như sau. Hãy đảm bảo tuân thủ đúng định dạng chỉ cần trả về kết quả như dưới không cần giải thích gì thêm:
    {
      "chain of thought": "Giải thích quá trình phân tích yêu cầu của người dùng và chọn danh mục phù hợp.",
      "decision": "<mã danh mục>",
      "message": ""
    }
    \"\"\"`;
}

const recommentCategoryAgent = (preData, message, recommentId) => {
    // Read the JSON file
    let systemPrompt = ''
    const rawData = fs.readFileSync(`src/data/list_menu.json`, 'utf-8');
    const listMenu = JSON.parse(rawData);

    for (const menu of listMenu) {
        const linkParts = menu.link.split("/");
        const urlKey = linkParts[linkParts.length - 2];
        const categoryId = parseInt(menu.link.split("/").pop().replace("c", ""), 10);

        if (categoryId === recommentId) {
            const rawData = fs.readFileSync(`src/data/products/${urlKey}/categoryList.json`, 'utf-8');
            const categoryList = JSON.parse(rawData);

            promt = generateSystemPrompt(categoryList)
            break
        }
    }

    const data = [
        ...preData,
        {
            role: "system",
            content: systemPrompt,
        },
        {
            role: "user",
            content: message,
        }
    ]

    return callAI(data)
}

export default recommentCategoryAgent