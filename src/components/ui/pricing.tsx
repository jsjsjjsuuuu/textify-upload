"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Check, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Link } from "react-router-dom";
interface PricingPlan {
  name: string;
  price: string;
  yearlyPrice: string;
  period: string;
  features: string[];
  description: string;
  buttonText: string;
  href: string;
  isPopular: boolean;
}
interface PricingProps {
  plans: PricingPlan[];
  title?: string;
  description?: string;
}

// وظيفة مساعدة لتنسيق الأرقام كعملة
const formatCurrency = (value: number): string => {
  return value.toLocaleString('ar-SA', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).replace(/SAR/g, '');
};

// دالة مساعدة لتنسيق الدينار العراقي
const formatIraqiDinar = (value: number): string => {
  const formatter = new Intl.NumberFormat('ar-IQ', {
    style: 'currency',
    currency: 'IQD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
  return formatter.format(value).replace(/IQD/g, '');
};

export function Pricing({
  plans,
  title = "أسعار بسيطة وشفافة",
  description = "اختر الخطة المناسبة لك، جميع الخطط تشمل الوصول إلى منصتنا وأدوات معالجة الصور ودعم مخصص."
}: PricingProps) {
  const [isMonthly, setIsMonthly] = useState(true);
  const [animateNumbers, setAnimateNumbers] = useState(false);
  const switchRef = useRef<HTMLButtonElement>(null);
  const handleToggle = (checked: boolean) => {
    setIsMonthly(!checked);
    setAnimateNumbers(true);

    // إعادة تعيين حالة الرسوم المتحركة بعد الانتهاء من الرسوم المتحركة
    setTimeout(() => setAnimateNumbers(false), 500);
  };
  return <div className="container py-20">
      <div className="text-center space-y-4 mb-12">
        <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
          {title}
        </h2>
        <p className="text-muted-foreground text-lg whitespace-pre-line">
          {description}
        </p>
      </div>

      <div className="flex justify-center mb-10">
        <label className="relative inline-flex items-center cursor-pointer">
          <Label>
            
          </Label>
        </label>
        
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 sm:2 gap-4">
        {plans.map((plan, index) => (
          <motion.div 
            key={index} 
            initial={{
        y: 50,
        opacity: 0
      }} animate={{
        y: 0,
        opacity: 1
      }} transition={{
        duration: 0.6,
        delay: index * 0.1
      }} className={cn(`rounded-2xl border-[1px] p-6 bg-background text-center lg:flex lg:flex-col lg:justify-center relative`, plan.isPopular ? "border-primary border-2" : "border-border", "flex flex-col")}
          >
            {plan.isPopular && <div className="absolute top-0 left-0 bg-primary py-0.5 px-2 rounded-bl-xl rounded-tr-xl flex items-center">
                <Star className="text-primary-foreground h-4 w-4 fill-current" />
                <span className="text-primary-foreground mr-1 font-sans font-semibold">
                  الأكثر شعبية
                </span>
              </div>}
            
            <div className="flex-1 flex flex-col">
              
              <p className="text-base font-semibold text-muted-foreground">
                {plan.name}
              </p>
              
              <div className="mt-6 flex items-center justify-center gap-x-2">
                <motion.span 
                  className="text-5xl font-bold tracking-tight text-foreground" 
                  animate={{
                    scale: animateNumbers ? [1, 1.1, 1] : 1
                  }} 
                  transition={{
                    duration: 0.5
                  }}
                >
                  {isMonthly ? Number(plan.price) : Number(plan.yearlyPrice)}
                </motion.span>
                <span className="text-xs text-muted-foreground mr-1">
                  ألف
                </span>
              </div>

              

              <p className="text-xs leading-5 text-muted-foreground">
                شهريًا
              </p>

              <ul className="mt-5 gap-2 flex flex-col">
                {plan.features.map((feature, idx) => <li key={idx} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-right">{feature}</span>
                  </li>)}
              </ul>

              <hr className="w-full my-4" />

              <Button variant={plan.isPopular ? "default" : "outline"} className="group relative w-full gap-2 overflow-hidden text-lg font-semibold tracking-tighter" asChild>
                <Link to={plan.href}>
                  {plan.buttonText}
                </Link>
              </Button>
              <p className="mt-6 text-xs leading-5 text-muted-foreground">
                {plan.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>;
}
