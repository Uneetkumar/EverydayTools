"use client";

import React, { useState } from "react";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Mail, MessageSquare, CheckCircle, Send, Loader2 } from "lucide-react";
import { executeRecaptcha } from "@/lib/recaptcha";

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", topic: "Feedback", message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Execute reCAPTCHA Enterprise protection
      const token = await executeRecaptcha("CONTACT_FORM");
      if (token) {
        // Token obtained and ready to be verified on backend/API
      }
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <Breadcrumbs items={[{ name: "Contact & Support" }]} />

      <div className="space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Contact & Tool Feedback
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          Have a suggestion for a new calculator, found a bug in a formula, or want to partner with us? We review all feedback promptly.
        </p>
      </div>

      {/* Direct Contact Channels */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-1.5">
          <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
            <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>General Support</span>
          </div>
          <p className="text-xs text-slate-500">Bug reports & feature requests</p>
          <a href="mailto:support@tabbench.com" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline block pt-1">
            support@tabbench.com
          </a>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-1.5">
          <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
            <MessageSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Editorial & Math</span>
          </div>
          <p className="text-xs text-slate-500">Formula corrections & verifications</p>
          <a href="mailto:editorial@tabbench.com" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline block pt-1">
            editorial@tabbench.com
          </a>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-1.5">
          <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Response SLA</span>
          </div>
          <p className="text-xs text-slate-500">Our support commitment</p>
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300 block pt-1">
            Within 24–48 hours
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-6 sm:p-8 shadow-sm">
        {submitted ? (
          <div className="text-center py-10 space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Message Received!</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
              Thank you for helping make TabBench better. Our editorial and development team will review your inquiry.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="mt-4 px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition"
            >
              Send Another Note
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Your Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Jane Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="jane@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Topic
              </label>
              <select
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Feedback">Tool Feedback / Feature Request</option>
                <option value="Formula Correction">Math / Formula Accuracy Correction</option>
                <option value="Partnership">Commercial & Sponsorship Inquiry</option>
                <option value="Other">General Inquiry</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Your Message
              </label>
              <textarea
                rows={4}
                required
                placeholder="Describe your suggestion or the calculation issue you noticed..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-semibold flex items-center justify-center space-x-2 transition shadow-md shadow-indigo-600/20"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Message</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
