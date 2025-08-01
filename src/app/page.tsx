"use client";
import Image from "next/image";
import Link from "next/link";

// If using Next.js App Router, put <Head> in your layout or below:
import Head from "next/head";

export default function HomePage() {
  return (
    <>
      {/* SEO & Social Meta */}
      <Head>
        <title>RunMacros: Effortless Macro & Calorie Tracking</title>
        <meta
          name="description"
          content="RunMacros makes macro and calorie tracking simple. Discover AI-powered meal plans, track nutrition, and reach your fitness goals. Start for free today!"
        />
        {/* AdSense verification tag could go here, if required */}
      </Head>

      <main className="min-h-screen bg-white text-gray-800">
        {/* Hero Section */}
        <section className="text-center py-20 bg-gradient-to-b from-green-100 to-white">
          <h1 className="text-4xl font-bold mb-4">Track Your Macros Effortlessly</h1>
          <p className="text-lg max-w-xl mx-auto mb-6">
            RunMacros is your all-in-one macro and calorie tracker.<br />
            Plan meals, track daily nutrition, and reach your fitness goals faster.
          </p>
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition"
          >
            Start Tracking
          </Link>
        </section>
        <section className="py-16 max-w-4xl mx-auto px-6">
  <h2 className="text-2xl font-bold mb-4">About RunMacros</h2>
  <p className="text-gray-700 mb-4">
    At RunMacros, our mission is to empower everyone—beginners and experienced athletes alike—to take control of their nutrition in a simple, enjoyable way. We believe that understanding what you eat is the first step towards a healthier lifestyle, which is why we built a tool that removes the guesswork from meal planning and calorie counting. Whether you want to lose weight, gain muscle, or simply eat healthier, RunMacros makes it easy to log your food, set personal goals, and track your daily progress.
  </p>
  <p className="text-gray-700 mb-4">
    Unlike other complicated nutrition trackers, RunMacros combines the latest technology with a user-friendly interface. You don’t have to be a nutritionist to get results—our smart system offers guidance and recommendations tailored to your needs. We focus on making healthy living accessible to everyone, without restrictive diets or expensive plans. Everything you need is right at your fingertips, for free.
  </p>
</section>


        {/* AdSense Slot - Top Banner */}
        <div className="flex justify-center my-8">
          {/* AdSense Code: Place your own <script> or <ins> here */}
          <div className="w-full max-w-xl flex justify-center">
            {/* Example placeholder for AdSense (replace with your ad code) */}

          </div>
        </div>

        {/* Features Section */}
        <section className="py-16 max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-8 text-center">
          <div>
            <Image src="/meal.png" alt="Meal Planning illustration" width={120} height={120} className="mx-auto mb-4"/>
            <h2 className="text-xl font-semibold">Meal Planning</h2>
            <p className="mt-2 text-gray-600">
              Organize your meals and get personalized macro insights for every day.
            </p>
          </div>
          <div>
            <Image src="/ai-recipes.png" alt="AI-generated Recipes illustration" width={120} height={120} className="mx-auto mb-4"/>
            <h2 className="text-xl font-semibold">AI-Powered Recipes</h2>
            <p className="mt-2 text-gray-600">
              Discover healthy recipes tailored to your nutrition needs.
            </p>
          </div>
          <div>
            <Image src="/dashboard.png" alt="Progress Tracking illustration" width={120} height={120} className="mx-auto mb-4"/>
            <h2 className="text-xl font-semibold">Track Progress</h2>
            <p className="mt-2 text-gray-600">
              Monitor daily macros, calories, and progress towards your goals.
            </p>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-16 bg-gray-50 text-center">
          <h2 className="text-2xl font-bold mb-8">How It Works</h2>
          <div className="flex flex-col md:flex-row justify-center gap-10 max-w-5xl mx-auto">
            <div className="flex-1">
              <div className="text-green-500 text-3xl mb-2">1</div>
              <h3 className="text-lg font-semibold">Sign Up for Free</h3>
              <p className="text-gray-600 mt-1">Create your account and personalize your nutrition goals in seconds.</p>
            </div>
            <div className="flex-1">
              <div className="text-green-500 text-3xl mb-2">2</div>
              <h3 className="text-lg font-semibold">Set Your Goals</h3>
              <p className="text-gray-600 mt-1">Choose your daily calorie and macro targets. We handle the rest.</p>
            </div>
            <div className="flex-1">
              <div className="text-green-500 text-3xl mb-2">3</div>
              <h3 className="text-lg font-semibold">Track & Succeed</h3>
              <p className="text-gray-600 mt-1">Log meals, get AI recipe ideas, and watch your progress day by day.</p>
            </div>
          </div>
        </section>

        <section className="py-16 max-w-4xl mx-auto px-6">
  <h2 className="text-2xl font-bold mb-4">Why Choose RunMacros?</h2>
  <p className="text-gray-700 mb-4">
    With so many macro trackers out there, you might be wondering what makes RunMacros different. Our platform is built for real people with busy lives—no unnecessary steps, no confusing charts. We value your time and your privacy, so you’ll never see intrusive ads, and your data is always secure.
  </p>
  <p className="text-gray-700 mb-4">
    We use artificial intelligence to help you discover new meal ideas based on your preferences and nutritional needs. You can customize your goals, get instant feedback, and even generate healthy recipes with one click. No more scrolling through endless databases—RunMacros gives you personalized suggestions every day. Our supportive community and constantly growing features make it the perfect place to start your nutrition journey.
  </p>
</section>


        {/* AdSense Slot - In Content */}
        <div className="flex justify-center my-8">
          <div className="w-full max-w-xl flex justify-center">

          </div>
        </div>

        {/* Testimonials Section */}
        <section className="py-16 max-w-6xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-center mb-10">What Users Are Saying</h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="bg-white p-6 rounded-xl shadow">
              <p className="text-lg italic mb-2">"Best macro tracker I've used! Love the meal planning feature."</p>
              <div className="font-semibold text-green-700">— Ahmet K.</div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow">
              <p className="text-lg italic mb-2">"AI recipes help me eat healthier. Super easy to use."</p>
              <div className="font-semibold text-green-700">— Elif Y.</div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow">
              <p className="text-lg italic mb-2">"Tracking calories and macros is finally fun!"</p>
              <div className="font-semibold text-green-700">— Burak D.</div>
            </div>
          </div>
        </section>
<section className="py-16 max-w-4xl mx-auto px-6">
  <h2 className="text-2xl font-bold mb-4">A Better Way to Eat Well</h2>
  <p className="text-gray-700 mb-4">
    We know that healthy living can feel overwhelming. That’s why RunMacros is designed to remove stress from eating well. Our app provides clear insights into your nutrition, encourages balanced meals, and celebrates your small wins along the way. Instead of restrictive diets, we focus on progress and learning. Every healthy choice counts, and we’re here to make each one easier.
  </p>
</section>

        {/* FAQ Section */}
        <section className="py-16 bg-gray-50 max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-center mb-10">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold">Is RunMacros free?</h3>
              <p className="text-gray-600">Yes! RunMacros offers free meal planning and macro tracking for everyone.</p>
            </div>
            <div>
              <h3 className="font-semibold">Can I use it on mobile?</h3>
              <p className="text-gray-600">Of course! RunMacros is mobile-friendly and works great on all devices.</p>
            </div>
            <div>
              <h3 className="font-semibold">What if I don’t know my macros?</h3>
              <p className="text-gray-600">No worries! Just enter your goals and we’ll suggest the perfect macro split for you.</p>
            </div>
            <div>
              <h3 className="font-semibold">Is my data private?</h3>
              <p className="text-gray-600">Absolutely. Your nutrition data stays safe and is never shared.</p>
            </div>
          </div>
        </section>

<section className="py-16 max-w-4xl mx-auto px-6">
  <h2 className="text-2xl font-bold mb-4">Your Privacy Matters</h2>
  <p className="text-gray-700 mb-4">
    We understand that your health data is personal. That’s why RunMacros is committed to protecting your privacy. We do not sell or share your information with third parties, and all data is securely stored. Our privacy policy is transparent, and you’re always in control of your own account. If you have any questions or concerns, our team is here to help.
  </p>
</section>

        {/* Call to Action */}
        <section className="py-20 text-center bg-green-50">
          <h2 className="text-3xl font-bold mb-4">Ready to Reach Your Goals?</h2>
          <Link
            href="/profile"
            className="px-8 py-4 bg-green-500 text-white rounded-xl text-lg hover:bg-green-600 transition"
          >
            Create Your Free Account
          </Link>
        </section>

        {/* AdSense Slot - Footer */}
        <div className="flex justify-center my-8">
          <div className="w-full max-w-xl flex justify-center">

          </div>
        </div>

<section className="py-16 max-w-4xl mx-auto px-6">
  <h2 className="text-2xl font-bold mb-4">Community & Support</h2>
  <p className="text-gray-700 mb-4">
    At RunMacros, you’re never alone on your journey. Join a supportive community of users who share tips, recipes, and motivation. Our platform offers regular updates, new features, and responsive customer support. Whether you need technical help or nutrition advice, we’re always here to guide you. Together, we can make healthy living a habit.
  </p>
</section>


        {/* Footer */}
        <footer className="py-8 text-center text-sm text-gray-500">
          <Link href="/about" className="mx-2 hover:underline">About</Link> |
          <Link href="/privacy" className="mx-2 hover:underline">Privacy Policy</Link> |
          <Link href="/contact" className="mx-2 hover:underline">Contact</Link>
          <p className="mt-2">&copy; {new Date().getFullYear()} RunMacros. All rights reserved.</p>
        </footer>
      </main>
    </>
  );
}
