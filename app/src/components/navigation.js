import { useNavigate } from "react-router-dom"
import BackIcon from "../assets/back-arrow.svg"

export function BackButton() {
	const navigate = useNavigate();

	function goHome() {
		console.log('going-home')
		navigate("/")
	}

	return (
		<img src={BackIcon} alt="back button" onClick={goHome} style={{ height: '50px'}}></img>
	)
}