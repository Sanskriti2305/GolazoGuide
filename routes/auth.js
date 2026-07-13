const express = require("express");

const router = express.Router();

module.exports = (supabase) => {

    // ==========================
    // SIGN UP
    // ==========================

    router.post("/signup", async (req, res) => {

        try {

            const { name, email, password } = req.body;

            if (!name || !email || !password) {
                return res.status(400).json({
                    error: "All fields are required."
                });
            }

            const { data, error } = await supabase.auth.signUp({

                email,

                password,

                options: {
                    data: {
                        full_name: name
                    }
                }

            });

            if (error) {

                return res.status(400).json({
                    error: error.message
                });

            }

            return res.json({

                success: true,

                message: "Account created successfully."

            });

        }

        catch (err) {

            console.error(err);

            res.status(500).json({

                error: "Internal server error."

            });

        }

    });



    // ==========================
    // LOGIN
    // ==========================

    router.post("/login", async (req, res) => {

        try {

            const { email, password } = req.body;

            const { data, error } =
                await supabase.auth.signInWithPassword({

                    email,

                    password

                });

            if (error) {

                return res.status(401).json({

                    error: error.message

                });

            }

            res.json({

                success: true,

                token: data.session.access_token,

                user: data.user

            });

        }

        catch (err) {

            console.error(err);

            res.status(500).json({

                error: "Internal server error."

            });

        }

    });



    // ==========================
    // CURRENT USER
    // ==========================

    router.get("/me", async (req, res) => {

        try {

            const authHeader = req.headers.authorization;

            if (!authHeader)
                return res.status(401).json({

                    error: "Unauthorized"

                });

            const token =
                authHeader.split(" ")[1];

            const { data, error } =
                await supabase.auth.getUser(token);

            if (error)
                return res.status(401).json({

                    error: error.message

                });

            res.json(data.user);

        }

        catch (err) {

            res.status(500).json({

                error: "Internal server error"

            });

        }

    });



    // ==========================
    // LOGOUT
    // ==========================

    router.post("/logout", async (req, res) => {

        res.json({

            success: true

        });

    });



    return router;

};