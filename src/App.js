import Prompt from "./components/prompt/Prompt"
import Editor from "./components/editor/Editor"
import "./app.css"

export default function App() {
	return (
		<div className="page">
			<div className="header">
				Header
			</div>
			<div className="body">
				<Editor />
				<Prompt />
			</div>
		</div>
	)
}