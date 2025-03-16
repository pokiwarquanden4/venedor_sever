import agentController from "./agent/agent_controller";

const askChatbot = (preData, message) => {
    return agentController(preData, message)
}

export default askChatbot