import mongoose from 'mongoose'
import User from '../models/User.js'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/school-management-system'

async function reset(email, newPassword) {
  await mongoose.connect(MONGO_URI)
  console.log('Connected to DB')
  const user = await User.findOne({ email: email.toLowerCase() })
  if (!user) {
    console.error('User not found:', email)
    process.exit(1)
  }
  user.password = newPassword
  await user.save()
  console.log(`Password for ${email} reset to '${newPassword}'`)
  process.exit(0)
}

const [,, email, newPassword] = process.argv
if (!email || !newPassword) {
  console.error('Usage: node reset-admin-password.js <email> <newPassword>')
  process.exit(1)
}
reset(email, newPassword).catch(err => {
  console.error(err)
  process.exit(1)
})
