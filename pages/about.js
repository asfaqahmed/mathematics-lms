import { motion } from 'framer-motion'
import { 
  FiUsers, FiAward, FiBook, FiTarget,
  FiCheckCircle, FiStar, FiTrendingUp, FiHeart
} from 'react-icons/fi'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'

export default function About({ user }) {
  const stats = [
    { icon: FiUsers, value: '10,000+', label: 'Happy Students' },
    { icon: FiBook, value: '50+', label: 'Courses' },
    { icon: FiAward, value: '98%', label: 'Success Rate' },
    { icon: FiStar, value: '4.9/5', label: 'Average Rating' }
  ]
  
  const values = [
    {
      icon: FiTarget,
      title: 'Excellence',
      description: 'We strive for excellence in every lesson, ensuring the highest quality education.'
    },
    {
      icon: FiHeart,
      title: 'Passion',
      description: 'Our passion for mathematics drives us to make learning engaging and enjoyable.'
    },
    {
      icon: FiUsers,
      title: 'Community',
      description: 'We build a supportive community where students help each other succeed.'
    },
    {
      icon: FiTrendingUp,
      title: 'Innovation',
      description: 'We continuously innovate our teaching methods to deliver better results.'
    }
  ]
  
  const team = [
    {
      name: 'Dr. Asfaq Ahmed',
      role: 'Founder & Lead Instructor',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      bio: '15+ years of teaching experience'
    },
    {
      name: 'Sarah Johnson',
      role: 'Senior Math Instructor',
      image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      bio: 'PhD in Applied Mathematics'
    },
    {
      name: 'Michael Chen',
      role: 'Curriculum Developer',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      bio: 'Expert in educational technology'
    },
    {
      name: 'Priya Sharma',
      role: 'Student Success Manager',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      bio: 'Dedicated to student achievement'
    }
  ]
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
      <Header user={user} />
      
      {/* Hero Section */}
      <section className="relative pt-20 pb-16">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full filter blur-3xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-6xl font-display font-bold text-white mb-6">
              About <span className="gradient-text">MathPro Academy</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Empowering students with world-class mathematics education through innovative 
              teaching methods and personalized learning experiences.
            </p>
          </motion.div>
        </div>
      </section>
      
      {/* Stats Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const IconComponent = stat.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-primary-500/20">
                    <IconComponent className="w-8 h-8 text-primary-400" />
                  </div>
                  <div className="text-3xl font-bold text-white mb-2">{stat.value}</div>
                  <div className="text-gray-400">{stat.label}</div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>
      
      {/* Mission Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-display font-bold text-white mb-6">
                Our Mission
              </h2>
              <p className="text-gray-400 mb-6">
                At MathPro Academy, our mission is to make quality mathematics education 
                accessible to everyone. We believe that with the right guidance and resources, 
                anyone can master mathematics and unlock their full potential.
              </p>
              <p className="text-gray-400 mb-6">
                We combine traditional teaching methods with modern technology to create an 
                engaging and effective learning experience that adapts to each student's needs.
              </p>
              <div className="space-y-3">
                {[
                  'Personalized learning paths',
                  'Expert instructors',
                  'Interactive content',
                  '24/7 support'
                ].map((item, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <FiCheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="text-gray-300">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-video rounded-2xl overflow-hidden glass">
                <img
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=400&fit=crop"
                  alt="Students learning mathematics together"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600&h=400&fit=crop"
                  }}
                />
              </div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-gradient-to-r from-primary-500 to-purple-500 rounded-full opacity-20 blur-2xl"></div>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Values Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-display font-bold text-white mb-4">
              Our Core Values
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              These values guide everything we do at MathPro Academy
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => {
              const IconComponent = value.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="card text-center"
                >
                  <div className="inline-flex items-center justify-center w-14 h-14 mb-4 rounded-lg bg-gradient-to-r from-primary-500/20 to-purple-500/20">
                    <IconComponent className="w-7 h-7 text-primary-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{value.title}</h3>
                  <p className="text-gray-400">{value.description}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>
      
      {/* Team Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-display font-bold text-white mb-4">
              Meet Our Team
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Dedicated professionals committed to your success
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="card text-center"
              >
                <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden bg-gradient-to-r from-primary-500 to-purple-500 p-1">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full rounded-full object-cover bg-dark-800"
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&size=150&background=1f2937&color=ffffff&format=png`
                    }}
                  />
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">{member.name}</h3>
                <p className="text-primary-400 text-sm mb-2">{member.role}</p>
                <p className="text-gray-400 text-sm">{member.bio}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="card bg-gradient-to-r from-primary-600/20 to-purple-600/20 text-center"
          >
            <h2 className="text-3xl font-display font-bold text-white mb-4">
              Ready to Start Your Journey?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands of students who have transformed their understanding of mathematics
            </p>
            <a
              href="/courses"
              className="inline-flex items-center justify-center px-8 py-4 font-semibold text-white bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg hover:from-primary-600 hover:to-primary-700 transform hover:scale-105 transition-all duration-200"
            >
              Explore Courses
            </a>
          </motion.div>
        </div>
      </section>
      
      <Footer />
    </div>
  )
}