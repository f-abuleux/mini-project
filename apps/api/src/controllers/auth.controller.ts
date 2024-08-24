import { createToken } from "@/helpers/createToken"
import { hashPass } from "@/helpers/hashpassword"
import { transporter } from "@/helpers/nodemailer"
import prisma from "@/prisma"
import { compare } from "bcrypt"
import { Request, Response } from "express"
import path from 'path'
import fs from 'fs'
import handlebars from "handlebars"
import jwt from 'jsonwebtoken'
import { referalCodeGenerator } from "@/helpers/referalcodegenerator"
import { UserController } from "./user.controller"

export class AuthController {

      constructor() { }
      async createUserData(req: Request, res: Response) {
            try {
                  const newUser = await prisma.user.findFirst({
                        where: {
                              OR: [
                                    { username: req.body.username },
                                    { email: req.body.email },
                              ]
                        }
                  })
                  if (newUser?.username === req.body.username) throw 'Username already exist'
                  if (newUser?.email === req.body.email) throw 'Email already exist'

                  const password = await hashPass(req.body.password)

                  const createdUser = await prisma.user.create({
                        data: {
                              ...req.body, password,
                        }
                  })

                  const token = createToken({ id: createdUser.id, role: createdUser.role }, '365d')

                  const templatePath = path.join(__dirname, '../templates', "verify.hbs")
                  const templateSource = fs.readFileSync(templatePath, 'utf-8').toString()
                  const compiledTemplate = handlebars.compile(templateSource)
                  const html = compiledTemplate({
                        username: req.body.username,
                        link: `http://localhost:3000/verify/${token}`
                  })

                  await transporter.sendMail({
                        from: process.env.MAIL_USER,
                        to: req.body.email,
                        subject: 'EventUs - Verify your account - Welcome to EventUs',
                        html
                  })

                  res.status(200).send({
                        status: 'Success created user',
                        data: createdUser,
                  })
            } catch (error) {
                  res.status(400).send({
                        status: "Failed created user",
                        msg: error
                  })
            }
      }

      async loginUserData(req: Request, res: Response) {
            try {
                  const user = await prisma.user.findFirst({
                        where: {
                              OR: [
                                    { username: req.body.username },
                                    { email: req.body.username }
                              ]
                        }
                  })
                  // console.log(user)

                  if (!user) throw 'User not found'
                  if (!user.isVerify) throw 'User not verified'

                  const isValidPass = await compare(req.body.password, user.password)
                  if (!isValidPass) throw 'Incorrect password'

                  const token = createToken({ id: user.id, role: user.role }, "1d")

                  if (user.createdAd && user.referalcode !== "") {
                        const currentDate = new Date();
                        const expirationDate = new Date(user.createdAd);
                        expirationDate.setMonth(expirationDate.getMonth() + 3);
                        if (currentDate > expirationDate) {
                              await prisma.user.update({
                                    where: { referalnumber: user.referalcode !== null ? user.referalcode : undefined },
                                    data: { point: { decrement: 10000 } }
                              });
                              await prisma.user.update({
                                    where: { id: user.id },
                                    data: { referalcode: '' }
                              })
                        }
                  }

                  if (user.referalnumber !== "") {

                        const updateAllReferal = await prisma.user.updateMany({
                              where: {
                                    createdAd: {
                                          lt: new Date(new Date().setMonth(new Date().getMonth() - 3))
                                    }
                              },
                              data: {
                                    referalcode: ''
                              }
                        })

                        const updatePoint = await prisma.user.update({
                              where: { referalnumber: user.referalnumber! },
                              data: { point: { decrement: updateAllReferal.count * 10000 } }
                        })

                        console.log(updatePoint)

                        // for (let i = 0; i < expireFinder.length; i++) {
                        //       const currentDate = new Date()
                        //       const expirationDate = new Date(expireFinder[i].createdAd)
                        //       expirationDate.setMonth(expirationDate.getMonth() + 3)
                        //       if(currentDate > expirationDate){
                        //             await prisma.user.update({
                        //                   where: { referalcode: expireFinder.referalnumber!},
                        //                   data: { referalcode: '' }
                        //             })
                        //       }
                        // }
                  }

                  if (user.point < 0) {
                        await prisma.user.update({
                              where: { id: user.id },
                              data: { point: 0 },
                        });
                  }

                  res.status(200).send({
                        status: 'ok',
                        msg: 'Success login user',
                        token,
                        user
                  })
            } catch (error) {
                  res.status(400).send({
                        status: 'Failed login user',
                        msg: error
                  })
            }
      }

      async verifyToken(req: Request, res: Response) {
            const { token } = req.params
            try {
                  jwt.verify(token, process.env.SECRET_KEY!, async (err, user) => {
                        if (err) {
                              res.status(400).send("Invalid token")
                        } else {
                              const verifiedUser = await prisma.user.update({
                                    where: {
                                          id: (user as { id: number }).id
                                    },
                                    data: {
                                          isVerify: true,
                                          referalnumber: referalCodeGenerator(),
                                          point: 0
                                    }
                              })
                              if (verifiedUser?.referalcode) {
                                    await prisma.user.update({
                                          where: { referalnumber: verifiedUser.referalcode },
                                          data: { point: { increment: 5000 } }
                                    })
                              }
                              // res.render("verifyToken")
                              res.status(200).send({
                                    status: 'Success verify user',
                                    data: { isVerified: true }
                              })
                        }
                  })
            } catch (error) {
                  res.status(400).send({
                        status: 'error',
                        msg: error
                  })
            }
      }

      async findReferalNumber(req: Request, res: Response) {
            try {
                  const response = await prisma.user.findFirst({
                        where: {
                              referalnumber: req.body.referalnumber
                        }, select: {
                              id: true,
                              username: true,
                              email: true,
                              referalnumber: true,
                              isVerify: true
                        }
                  })
                  console.log(response)
                  if (!response) throw 'Referal number not found'
                  if (response.isVerify == true) {
                        res.status(200).send({
                              status: 'Success get referal number',
                              data: response
                        })
                  } else {
                        res.status(400).send({
                              status: 'Failed get referal number',
                              msg: 'Referal number not verified'
                        })
                  }

            } catch (error) {
                  res.status(400).send({
                        status: 'error',
                        msg: error
                  })
            }
      }

      async updatePasswordUser(req: Request, res: Response){
            try {
                  // const password = await compare(req.body.password, user.password)
                  const user = await prisma.user.findUnique({
                        where: {
                              id: req.user?.id
                        },
                  })
                  const isValidPass = await compare(req.body.password, user?.password!)
                  if (!isValidPass) throw 'Incorrect password'

                  const { newPassword, confirmPassword} = req.body
                  if(newPassword !== confirmPassword) throw 'Password not match'

                  await prisma.user.update({
                        where: {
                              id: req.user?.id
                        },
                        data: {
                              password: await hashPass(newPassword)
                        }
                  })

                  res.status(200).send({
                        status: 'Success Update Password',
                        msg: 'Password updated',
                        user,
                  })
            } catch (error) {
                  res.status(400).send({
                        status: "Failed Update Password",
                        msg: error
                  })
            }
      }

      async updateEmailUser(req: Request, res: Response){
            try {
                  const user = await prisma.user.findUnique({
                        where: {
                              id: req.user?.id
                        },
                  })
                  if(req.body.email !== user?.email) throw 'Email not match'

                  const { newEmail, confirmEmail } = req.body
                  if(newEmail !== confirmEmail) throw 'Email not match'

                  await prisma.user.update({
                        where: {
                              id: req.user?.id
                        },
                        data: {
                              email: newEmail
                        }
                  })
                  const password = await compare(req.body.password, user?.password!)
                  if (!password) throw 'Incorrect password'
                  
                  res.status(200).send({
                        status: 'Success Update Email',
                        msg: 'Email updated',
                        user
                  })
            } catch (error) {
                  res.status(400).send({
                        status: "Failed Update Email",
                        msg: error
                  })
            }
      }
}

