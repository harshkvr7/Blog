import express from "express";
import axios from "axios";
import bodyparser from "body-parser";
import pg from "pg";
import fileupload from "express-fileupload";
import { Buffer } from "buffer"

function get_date_time() {
    var dateraw = new Date();

    var day = dateraw.getDay();
    var date = dateraw.getDate();
    var year = dateraw.getFullYear();
    var month = dateraw.getMonth();

    var daystr = '';
    var monthstr = '';

    switch (day) {
        case 0:
            daystr = 'Sunday';
            break;
        case 1:
            daystr = 'Monday';
            break;
        case 2:
            daystr = 'Tuesday';
            break;
        case 3:
            daystr = 'Wednesday';
            break;
        case 4:
            daystr = 'Thursday';
            break;
        case 5:
            daystr = 'Friday';
            break;
        case 6:
            daystr = 'Saturday';
            break;
        default:
            break;
    }

    switch (month) {
        case 0:
            monthstr = 'January';
            break;
        case 1:
            monthstr = 'February';
            break;
        case 2:
            monthstr = 'March';
            break;
        case 3:
            monthstr = 'April';
            break;
        case 4:
            monthstr = 'May';
            break;
        case 5:
            monthstr = 'June';
            break;
        case 6:
            monthstr = 'July';
            break;
        case 7:
            monthstr = 'August';
            break;
        case 8:
            monthstr = 'September';
            break;
        case 9:
            monthstr = 'October';
            break;
        case 10:
            monthstr = 'November';
            break;
        case 11:
            monthstr = 'December';
            break;

        default:
            break;
    }
    var date_time = { day: daystr, month: monthstr, date: date, year: year };

    return date_time;
}

const app = express();
const port = process.env.PORT || 4000;

app.use(express.static("public"));
app.use(bodyparser.urlencoded({ extended: true }));
app.use(fileupload());

const db = new pg.Client({
    user: "postgres.dgaaajenixemzvusrpel",
    host: "aws-0-ap-south-1.pooler.supabase.com",
    database: "postgres",
    password: "Harshkvr@2005",
    post: 5432,
})

db.connect();

var data;

db.query("SELECT * FROM blogs ORDER BY id desc LIMIT 10 OFFSET ($1 - 1) * 10", [1], (err, res) => {
    if (err) {
        console.error("error executing query", err.stack);
    }
    else {
        data = res.rows;
    }
});


app.get("/", async (req, res) => {
    const blogCountResult = await db.query("SELECT COUNT(id) as count from blogs;");
    const blogCount = blogCountResult.rows[0].count;

    var page = req.query.pg || 1;

    const offset = (page - 1) * 10;

    page = parseInt(page);

    const totalPages = Math.ceil(blogCount / 10);

    await db.query("SELECT * FROM blogs ORDER BY id desc LIMIT 10 OFFSET $1", [offset], (err, result) => {
        if (err) {
            console.error("error executing query", err.stack);
        } else {
            const data = result.rows;
            res.render("./main.ejs", { blogs: data, curr: page, max: totalPages });
        }
    });
});

app.get("/addblog", (req, res) => {
    res.render("./edit.ejs");
})

app.post("/addblog", async (req, res) => {
    var date_time = get_date_time();


    if (req.files) {
        const { name, data } = req.files.pic;

        const base64 = Buffer.from(data,
            "binary").toString("base64");

        await db.query("INSERT INTO blogs (content, date, month, img) VALUES ($1, $2, $3, $4)", [req.body.text, date_time.date, date_time.month, base64], () => {
            res.redirect("/");
        });
    }
    else {
        await db.query("INSERT INTO blogs (content, date, month) VALUES ($1, $2, $3)", [req.body.text, date_time.date, date_time.month], () => {
            res.redirect("/");
        });
    }
})

app.get("/deleteblog", async (req, res) => {
    const blogId = req.query.id;

    await db.query("DELETE FROM blogs WHERE id = $1", [blogId], () => {
        res.redirect("/");
    });
})

app.get("/updateblog", async (req, res) => {
    const blogId = req.query.id;

    const result = await db.query("SELECT * FROM blogs WHERE id = $1", [blogId]);
    const blog = result.rows[0];

    res.render("./edit.ejs", { blog: blog });
});

app.post("/updateblog", async (req, res) => {
    const { id, content } = req.body;

    await db.query("UPDATE blogs SET content = $1 WHERE id = $2", [content, id], () => {
        res.redirect("/");
    });
})

app.listen(port, () => {
    console.log(`server running on port ${port}`);
})
