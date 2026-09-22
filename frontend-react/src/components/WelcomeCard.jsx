import "../styles/dashboard.css"
function WelcomeCard({user_name,description}){
    return <div>
        <h1>Welcome back,{user_name}</h1>
        <h4>{description}</h4>
    </div>
}
export default WelcomeCard