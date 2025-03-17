import agentController from "./agent/agent_controller";

const askChatbot = async (preData, message) => {
    const results = await agentController(preData, message)
    return results
}

export default askChatbot