const express = require("express")
const cookieParser = require("cookie-parser")
const cors = require("cors")

const app = express()

app.use(express.json())
app.use(cookieParser())


app.use(cors({
    origin: [
        "https://interview-ai-d1s1.vercel.app",
        "http://localhost:5173"
    ],
    credentials: true
}))

app.use((err, req, res, next) => {
    console.error(err)
    const status = err.status || err.statusCode || 500
    res.status(status).json({ message: err.message || "Internal server error" })
})

/* require all the routes here */
const authRouter = require("./routes/auth.routes")
const interviewRouter = require("./routes/interview.routes")


/* using all the routes here */
app.use("/api/auth", authRouter)
app.use("/api/interview", interviewRouter)



module.exports = app