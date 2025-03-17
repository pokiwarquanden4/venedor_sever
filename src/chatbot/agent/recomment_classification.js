import { zodResponseFormat } from "openai/helpers/zod.mjs";
import { callAI } from "./utils";
import { z } from "zod";

const systemPrompt = `
    \"\"\"Bạn là một trợ lý AI cho một trang web thương mại điện tử, chuyên gợi ý sản phẩm cho người dùng dựa trên các tiêu chí khác nhau. Chúng tôi có 4 loại gợi ý như sau:
            price: Đề xuất các sản phẩm dựa trên mức giá mà người dùng quan tâm (thấp nhất - lowest_price, cao nhất - highest_price, trong khoảng giá nhất định - range(price-to-price)).
            hot: Đề xuất các sản phẩm phổ biến nhất dựa trên lượt bán cao hoặc thấp (most_sold hoặc least_sold), lượt đánh giá cao hoặc thấp (best_rated hoặc worst_rated).
            discount: Đề xuất các sản phẩm có mức giảm giá cao hoặc thấp (highest_discount, lowest_discount ) hoặc trong khoảng (discount(discount% to discount%)).
            brand: Đề xuất sản phẩm từ một thương hiệu cụ thể mà người dùng quan tâm (brand_name).

        Đầu ra của bạn phải ở định dạng JSON có cấu trúc như sau. Hãy đảm bảo tuân thủ đúng định dạng chỉ cần trả về kết quả như dưới không cần giải thích gì thêm:
        {
          "decision": "price" hoặc "hot" hoặc "discount" hoặc "brand", Chọn một hoặc nhiều danh mục từ danh sách trên rồi ghi vào mảng.
          "subtype": "lowest_price" hoặc "highest_price" hoặc "range(price-to-price)" hoặc "best_rated" hoặc "worst_rated" hoặc "most_sold" hoặc "least_sold" hoặc "highest_discount" hoặc "lowest_discount" hoặc "discount(discount% to discount%)" hoặc "brand_name(value)", Chọn một hoặc nhiều danh mục từ danh sách trên rồi ghi vào mảng.
          "message": "Đây là kết luận câu trả lời cho câu hỏi của người dùng hãy vào vai trợ lý AI vì tôi sẽ đưa tin nhắn này cho khách hàng"
        }

        Nếu không có kết quả phù hợp cho đầu ra thì sẽ luôn luôn là
        {
          "decision": ['hot']
          "subtype": ['most_sold']
          "message": "Đây là danh sách sản phẩm phổ biến nhất mà chúng tôi tìm thấy cho bạn!"
        }

        Ví dụ:
        Người dùng: "Tìm laptop dưới 15 triệu hãng dell"
        {
          "decision": ['price', 'brand'],
          "subtype": ['range(0-to-15.000.000)', 'brand_name('Dell')'],
          "message": "Đây là danh sách các mẫu laptop Dell có giá dưới 15 triệu mà chúng tôi tìm thấy cho bạn!"
        }

        Ví dụ:
        Người dùng: "Tìm laptop rẻ nhất của hãng dell"
        {
          "decision": ['price', 'brand'],
          "subtype": ['lowest_price', 'brand_name('Dell')'],
          "message": "Đây là danh sách các mẫu laptop Dell rẻ nhất mà chúng tôi tìm thấy cho bạn!"
        }

        Ví dụ:
        Người dùng: "Tìm laptop trên 15 triệu"
        {
          "decision": ["price"],
          "subtype": ["range(15000000 VND to infinity VND)"],
          "message": "Đây là danh sách các mẫu laptop có giá trên 15 triệu mà chúng tôi tìm thấy cho bạn!"
        }

        Ví dụ:
        Người dùng: "Tìm laptop được giảm giá trên 30%"
        {
          "decision": ["discount"],
          "subtype": ["discount(30% to 100%)"],
          "message": "Đây là danh sách các mẫu laptop đang được giảm giá từ 30% trở lên mà chúng tôi tìm thấy cho bạn!"
        }
\"\"\"`;

const RecommentClassificationFormat = z.object({
  decision: z.array(z.string()),
  subtype: z.array(z.string()),
  message: z.string(),
});

const recomment_classification = async (preData, message) => {
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

  const responseFormat = zodResponseFormat(RecommentClassificationFormat, "schemaName")

  const results = await callAI(data, responseFormat)
  return results
}

export default recomment_classification