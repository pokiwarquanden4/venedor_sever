import { agentChatbotController } from "./agent/agent_controller"

const askChatbot = async (preData, message) => {
    const results = await agentChatbotController(preData, message)
    return results
}

export default askChatbot