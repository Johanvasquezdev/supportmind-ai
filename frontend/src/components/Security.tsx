"use client";

import { CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

const items = [
  { title: "SOC 2 Type II", text: "Independently audited for security, availability, and confidentiality." },
  { title: "End-to-End Encryption", text: "All data encrypted in transit and at rest with AES-256 standards." },
  { title: "GDPR & CCPA Compliant", text: "Full compliance with global data privacy and regional regulations." },
  { title: "Regular Security Audits", text: "Quarterly penetration testing and continuous security monitoring." },
];

export function Security() {
  return (
    <section id="security" className="py-[120px] border-b border-[#1a1a2e]">
      <div className="mx-auto max-w-[1200px] px-6">
        
        {/* Header */}
        <div className="mb-16">
          <h2 className="font-sans text-[48px] font-bold text-[#F0EEE9] mb-4">Built Secure by Default</h2>
          <p className="font-sans text-[16px] text-[#6B6A72]">
            Your data security is our top priority. Built with industry-leading standards.
          </p>
        </div>

        {/* 4-Column Horizontal Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-y border-[#1a1a2e] bg-[#0d0d1a]">
          {items.map((item, idx) => (
            <motion.article 
              key={item.title} 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className={`p-10 border-[#1a1a2e] ${
                idx !== items.length - 1 ? "lg:border-r" : ""
              } ${
                idx % 2 === 0 ? "sm:border-r lg:border-r" : ""
              } border-b lg:border-b-0`}
            >
              <div className="space-y-6">
                <CheckCircle className="size-5 text-[#7c3aed]" strokeWidth={1.5} />
                <h3 className="font-sans text-[15px] font-bold text-[#F0EEE9]">
                  {item.title}
                </h3>
                <p className="font-sans text-[13px] text-[#6B6A72] leading-relaxed">
                  {item.text}
                </p>
              </div>
            </motion.article>
          ))}
        </div>

      </div>
    </section>
  );
}
