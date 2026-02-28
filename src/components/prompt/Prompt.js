import { useState, useEffect, useRef } from "react";
import * as webllm from "https://esm.run/@mlc-ai/web-llm";

import "./prompt.css"

export default function Prompt() {
	const [messages, setMessages] = useState([
		{
			content: "You are a helpful AI agent helping users in code execution.",
			role: "system"
		}
	]);

	const [input, setInput] = useState("");
	const [engine, setEngine] = useState(null);
	const [engineInit, setEngineInit] = useState(false)
	const [loading, setLoading] = useState(false);
	const [downloadStatus, setDownloadStatus] = useState("");
	// const [chatStats, setChatStats] = useState("");
	const [modelLoaded, setModelLoaded] = useState(false);

	const chatBoxRef = useRef(null);

	const selectedModel = "Qwen2.5-Coder-1.5B-Instruct-q4f16_1-MLC";

	useEffect(() => {
		const engineInstance = new webllm.MLCEngine();

		engineInstance.setInitProgressCallback((report) => {
			setDownloadStatus(report.text);
		});

		setEngine(engineInstance);
		setEngineInit(true)
	}, [])

	useEffect(() => {

		(async function () {

			if (!engine) return;

			setDownloadStatus("Downloading...");
			const config = {
				temperature: 1.0,
				top_p: 1
			};

			await engine.reload(selectedModel, config);
			setModelLoaded(true);
			setDownloadStatus("Model Loaded ✅");
			setTimeout(() => {
				setDownloadStatus("")
			}, 2000)
		})();

	}, [engineInit]);

	/*************** Auto Scroll ***************/
	useEffect(() => {
		if (chatBoxRef.current) {
			chatBoxRef.current.scrollTop =
				chatBoxRef.current.scrollHeight;
		}
	}, [messages]);

	/*************** Streaming Generation ***************/
	async function streamingGenerating(updatedMessages) {
		if (!engine) return;

		try {
			let curMessage = "";

			const completion = await engine.chat.completions.create({
				stream: true,
				messages: updatedMessages
			});

			setMessages((prev) => {
				const aiMessage = {
					content: input.trim(),
					role: "assistant"
				};
				const updated = [...prev, aiMessage];
				updated[updated.length - 1].content = "Generating...";
				return updated;
			});

			for await (const chunk of completion) {
				const delta = chunk.choices[0].delta.content;
				if (delta) {
					curMessage += delta;

					setMessages((prev) => {
						const updated = [...prev];
						updated[updated.length - 1].content = curMessage;
						return updated;
					});
				}
			}

			const finalMessage = await engine.getMessage();

			setMessages((prev) => {
				const updated = [...prev];
				updated[updated.length - 1].content = finalMessage;
				return updated;
			});

			// const statsText = await engine.runtimeStatsText();
			// setChatStats(statsText);
			setLoading(false);
		} catch (err) {
			console.error(err);
			setLoading(false);
		}
	}

	/*************** Send Message ***************/
	function handleSend() {
		if (!input.trim()) return;

		const userMessage = {
			content: input.trim(),
			role: "user"
		};

		const updatedMessages = [
			...messages,
			userMessage,
		];

		setMessages(updatedMessages);
		setInput("");
		setLoading(true);

		streamingGenerating(updatedMessages);
	}

	return (
		<div className="prompt">
			<div className="chat-container">

				<div>{downloadStatus}</div>

				<div ref={chatBoxRef} className="chat-box" id="chat-box">
					{messages
						.filter((m) => m.role !== "system")
						.map((message, index) => (
							<div
								key={index}
								className={`message-container ${message.role}`}
							>
								<div className="message">
									{message.content}
								</div>
							</div>
						))}
				</div>

				<div className="chat-input-container">
					<input
						type="text"
						value={input}
						id="user-input"
						placeholder={loading ? "Generating..." : "Type a message..."}
						onChange={(e) => setInput(e.target.value)}
						disabled={!modelLoaded || loading}
					/>

					<button
						onClick={handleSend}
						disabled={!modelLoaded || loading}
						id="send"
					>
						{loading ? "Generating..." : "Send"}
					</button>
				</div>
			</div>
		</div>
	);
}
