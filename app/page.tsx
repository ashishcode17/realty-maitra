'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Building2, Users, TrendingUp, Award, BookOpen, 
  Target, Shield, ChevronRight, CheckCircle2 
} from 'lucide-react';
import Link from 'next/link';
import { brand } from '@/lib/brand';
import { BrandLogo } from '@/components/BrandLogo';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Navigation */}
      <nav className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm fixed w-full z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <BrandLogo href="/" size="md" variant="light" />
          <div className="hidden md:flex items-center space-x-8">
            <a href="#about" className="text-slate-300 hover:text-white transition">About</a>
            <a href="#how-it-works" className="text-slate-300 hover:text-white transition">How It Works</a>
            <a href="#programs" className="text-slate-300 hover:text-white transition">Programs</a>
            <a href="#faq" className="text-slate-300 hover:text-white transition">FAQ</a>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/login">
              <Button variant="outline" className="border-slate-500 bg-slate-800/90 text-white hover:bg-slate-700 hover:border-slate-400">
                Login
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Build Teams.<br />
            Build Trust.<br />
            <span className="text-emerald-500">Create Income.</span>
          </h1>
          <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto">
            A professional platform for real estate networking, training, and performance-based rewards. 
            Grow your network, access premium projects, and unlock your potential.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link href="/register">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white text-lg px-8 py-6">
                Request Access
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="border-slate-500 bg-slate-800/90 text-white hover:bg-slate-700 hover:border-slate-400 text-lg px-8 py-6">
                Member Login
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* What It Is */}
      <section id="about" className="py-20 px-4 bg-slate-900/50">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-white text-center mb-4">What is {brand.appName}?</h2>
          <p className="text-xl text-slate-300 text-center mb-12 max-w-3xl mx-auto">
            A transparent, training-driven ecosystem where real estate professionals build networks, 
            access quality projects, earn performance-based rewards, and grow their careers.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="pt-6">
                <Users className="h-12 w-12 text-emerald-500 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Network Building</h3>
                <p className="text-slate-300">
                  Build and manage your professional network with hierarchical team structure and transparent tracking.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="pt-6">
                <Building2 className="h-12 w-12 text-emerald-500 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Quality Projects</h3>
                <p className="text-slate-300">
                  Access to verified real estate projects with complete details, pricing, and documentation.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="pt-6">
                <TrendingUp className="h-12 w-12 text-emerald-500 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Performance Rewards</h3>
                <p className="text-slate-300">
                  Earn rewards based on your performance with transparent slab structures and timely payouts.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-white text-center mb-12">How It Works</h2>
          <div className="max-w-4xl mx-auto space-y-8">
            {[
              { step: 1, title: 'Join with Sponsor', desc: 'Register with a sponsor code to join the network under an experienced mentor' },
              { step: 2, title: 'Complete Training', desc: 'Access comprehensive training materials on sales, projects, and best practices' },
              { step: 3, title: 'Access Projects', desc: 'Browse and work on verified real estate projects with complete information' },
              { step: 4, title: 'Build Your Team', desc: 'Grow your network by sponsoring new members and building your downline' },
              { step: 5, title: 'Earn & Grow', desc: 'Receive performance-based rewards, unlock challenges, and advance your role' },
            ].map((item) => (
              <div key={item.step} className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {item.step}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-slate-300">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Programs */}
      <section id="programs" className="py-20 px-4 bg-slate-900/50">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-white text-center mb-12">Our Programs</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="pt-6">
                <BookOpen className="h-12 w-12 text-blue-500 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Training Center</h3>
                <ul className="text-slate-300 space-y-2">
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 mr-2 mt-0.5" />
                    <span>Onboarding & orientation</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 mr-2 mt-0.5" />
                    <span>Sales scripts & techniques</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 mr-2 mt-0.5" />
                    <span>Project walkthroughs</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 mr-2 mt-0.5" />
                    <span>Live training sessions</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="pt-6">
                <Target className="h-12 w-12 text-purple-500 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Challenges & Offers</h3>
                <ul className="text-slate-300 space-y-2">
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 mr-2 mt-0.5" />
                    <span>Performance challenges</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 mr-2 mt-0.5" />
                    <span>Exciting rewards</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 mr-2 mt-0.5" />
                    <span>Public recognition</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 mr-2 mt-0.5" />
                    <span>Team competitions</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="pt-6">
                <Award className="h-12 w-12 text-amber-500 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Rewards System</h3>
                <ul className="text-slate-300 space-y-2">
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 mr-2 mt-0.5" />
                    <span>Transparent slab structure</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 mr-2 mt-0.5" />
                    <span>Performance-based earnings</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 mr-2 mt-0.5" />
                    <span>Role advancement</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 mr-2 mt-0.5" />
                    <span>Milestone bonuses</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Trust & Transparency */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="bg-emerald-900/20 border border-emerald-800 rounded-lg p-8 max-w-4xl mx-auto">
            <Shield className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white text-center mb-4">Trust & Transparency</h2>
            <p className="text-slate-300 text-center mb-6 text-lg">
              {brand.appName} is NOT a "get rich quick" scheme or pyramid structure. 
              We are a professional training and project ecosystem with transparent operations.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-500 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-white">No False Promises</p>
                  <p className="text-slate-400 text-sm">Earnings based on actual performance and sales</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-500 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-white">Clear Structure</p>
                  <p className="text-slate-400 text-sm">Transparent slab configuration for all roles</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-500 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-white">Training First</p>
                  <p className="text-slate-400 text-sm">Comprehensive training before you start</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-500 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-white">Real Projects</p>
                  <p className="text-slate-400 text-sm">Work with verified real estate projects</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-4 bg-slate-900/50">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-4xl font-bold text-white text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {[
              {
                q: 'Is this a pyramid scheme or MLM?',
                a: `No. ${brand.appName} is a professional real estate networking platform with training, projects, and performance-based rewards. All earnings come from actual project sales, not recruitment.`
              },
              {
                q: 'Do I need prior real estate experience?',
                a: 'No prior experience required. We provide comprehensive training covering sales, projects, compliance, and best practices to help you succeed.'
              },
              {
                q: 'How do I join?',
                a: 'You need a sponsor code from an existing member to register. This ensures you have a mentor to guide you through the platform and training.'
              },
              {
                q: 'What kind of projects can I access?',
                a: 'You can access all active projects on the platform, including residential apartments, villas, commercial spaces, and plots with complete documentation and pricing.'
              },
              {
                q: 'How are rewards calculated?',
                a: 'Rewards are based on your role and performance. Each project has a transparent slab structure showing earnings for each role level (BDM to Director). Additional bonuses for uplines are also clearly defined.'
              },
              {
                q: 'Can I advance my role?',
                a: 'Yes! Based on your performance and team growth, admins can promote you to higher roles (SM, SSM, AVP, VP, Director) with increased reward percentages.'
              },
            ].map((faq, idx) => (
              <Card key={idx} className="bg-slate-800 border-slate-700">
                <CardContent className="pt-6">
                  <h3 className="text-lg font-bold text-white mb-2">{faq.q}</h3>
                  <p className="text-slate-300">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <BrandLogo href="/" size="sm" variant="light" />
              <p className="text-slate-400 text-sm mt-2">
                Professional real estate networking platform.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><Link href="/about" className="hover:text-white transition">About Us</Link></li>
                <li><Link href="#how-it-works" className="hover:text-white transition">How It Works</Link></li>
                <li><Link href="#programs" className="hover:text-white transition">Programs</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><Link href="#faq" className="hover:text-white transition">FAQs</Link></li>
                <li><a href={`mailto:${brand.supportEmail}`} className="hover:text-white transition">Contact Us</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><Link href="/terms" className="hover:text-white transition">Terms of Service</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-slate-400 text-sm">
            <p>&copy; {new Date().getFullYear()} {brand.appName}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
