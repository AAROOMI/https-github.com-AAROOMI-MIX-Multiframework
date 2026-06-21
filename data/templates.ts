import type { PrebuiltPolicyTemplate } from '../types';

export const policyTemplates: PrebuiltPolicyTemplate[] = [
    {
        id: 'template-access-control',
        title: 'General Access Control Policy | سياسة التحكم في الوصول العامة',
        description: 'A foundational policy for managing user access to company systems and data. | سياسة أساسية لإدارة وصول المستخدمين إلى أنظمة وبيانات لشركة.',
        content: {
            policy: `
# Access Control Policy | سياسة التحكم في الوصول

## 1. Purpose | ١. الغرض
This policy establishes the requirements for controlling access to the organization's information systems and data, ensuring that access is granted on a need-to-know and least privilege basis.
تحدد هذه السياسة متطلبات التحكم في الوصول إلى أنظمة معلومات المنظمة وبياناتها، مما يضمن منح الوصول على أساس الحاجة إلى المعرفة والحد الأدنى من الصلاحيات.

## 2. Scope | ٢. النطاق
This policy applies to all employees, contractors, and third-parties who require access to corporate information assets.
تسري هذه السياسة على جميع الموظفين والمقاولين والأطراف الخارجية الذين يتطلب عملهم الوصول إلى أصول معلومات الشركة.

## 3. Policy | ٣. السياسة
- All users shall be uniquely identified. / يجب تحديد هوية جميع المستخدمين بشكل فريد.
- Access rights shall be reviewed periodically. / يجب مراجعة حقوق وصلاحيات الوصول بشكل دوري.
- Privileged access shall be restricted and monitored. / يجب تقييد ومراقبة صلاحيات الوصول المتميز والمشرفين.
- A formal user access provisioning and de-provisioning process must be followed. / يجب اتباع إجراءات رسمية لإنشاء وإلغاء صلاحيات وصول المستخدمين.
`,
            procedure: `
# Access Control Procedure | إجراءات التحكم في الوصول

## 1. User Registration | ١. تسجيل المستخدمين
- HR notifies IT of a new employee. / تخطر إدارة الموارد البشرية إدارة تقنية المعلومات بالموظف الجديد.
- Hiring manager submits an access request form. / يقدم المدير المسؤول نموذج طلب صلاحيات الوصول.
- IT creates a unique user account. / تنشئ إدارة تقنية المعلومات حساباً فريداً للمستخدم.

## 2. Access Review | ٢. مراجعة صلاحيات الوصول
- System owners must review user access lists for their systems on a quarterly basis. / يجب على مالكي الأنظمة مراجعة قوائم صلاحيات وصول المستخدمين لأنظمتهم بشكل ربع سنوي.
- Any discrepancies must be reported to the Cybersecurity team. / يجب إبلاغ فريق الأمن السيبراني بأي اختلافات أو شكوك فوراً.

## 3. De-provisioning | ٣. إلغاء الصلاحيات
- HR notifies IT of an employee's termination. / تخطر إدارة الموارد البشرية إدارة تقنية المعلومات بانتهاء خدمات الموظف.
- All access must be revoked within 24 hours of notification. / يجب إلغاء كافة صلاحيات الوصول في غضون ٢٤ ساعة من الإخطار.
`,
            guideline: `
# Access Control Guidelines | إرشادات التحكم في الوصول

## Why is it important? | ما أهمية ذلك؟
We control access to our systems to protect our company's and our clients' data from being seen or changed by people who shouldn't have access.
نحن نتحكم في الوصول إلى أنظمتنا لحماية بيانات شركتنا وعملائنا من أي إطلاع أو تعديل غير مصرح به من قبل أشخاص لا يملكون الصلاحية.

## Your Responsibilities | مسؤولياتك كعضو فريق
- Never share your password. / لا تشارك كلمة المرور الخاصة بك على الإطلاق.
- Only access data that you need for your job. / لا تدخل إلا إلى البيانات التي تحتاجها لإنجاز مهام عملك فقط.
- Report any suspicious activity on your account immediately. / أبلغ عن أي نشاط مريب على حسابك فوراً وبدون تردد.
`
        }
    },
    {
        id: 'template-data-classification',
        title: 'Data Classification Policy | سياسة تصنيف البيانات والمعلومات',
        description: 'Defines data sensitivity levels and handling requirements for each. | يحدد مستويات حساسية البيانات ومتطلبات التعامل مع كل مستوى.',
        content: {
            policy: `
# Data Classification Policy | سياسة تصنيف البيانات

## 1. Purpose | ١. الغرض
This policy defines the framework for classifying data according to its sensitivity, value, and criticality to the organization, and to establish handling requirements for each classification level.
تحدد هذه السياسة إطار عمل لتصنيف البيانات بناءً على درجة حساسيتها وقيمتها وأهميتها القصوى للمنظمة، وضع بروتوكولات للتعامل مع كل مستوى تصنيف.

## 2. Scope | ٢. النطاق
This policy applies to all data created, stored, or processed by the organization, regardless of its format or location.
تسري هذه السياسة على جميع البيانات التي يتم إنشاؤها أو تخزينها أو معالجتها بواسطة المنظمة بغض النظر عن صيغتها أو موقعها.

## 3. Classification Levels | ٣. مستويات التصنيف
- **Public (عام):** Information intended for public consumption. / معلومات مخصصة للاستخدام العام والنشر.
- **Internal (داخلي):** Information for internal business use, not for public disclosure. / معلومات للاستخدام الداخلي للمنشأة وليست للنشر العام.
- **Confidential (سري):** Sensitive business information that could cause damage if disclosed. / معلومات عمل حساسة قد يتسبب الإفصاح عنها في وقوع ضرر للمنظمة.
- **Restricted (محدود / سري للغاية):** Highly sensitive information, subject to legal or regulatory restrictions. / معلومات عالية الحساسية وتخضع لقيود قانونية أو تنظيمية صارمة.
`,
            procedure: `
# Data Classification Procedure | إجراءات تصنيف البيانات

## 1. Classifying Data | ١. عملية تصنيف البيانات
- Data owners are responsible for assigning a classification level to their data. / يتحمل مالكو البيانات مسؤولية تحديد مستوى التصنيف المناسب لبياناتهم.
- The classification must be based on the Data Classification Policy. / يجب أن يستند التصنيف بدقة إلى بنود سياسة تصنيف البيانات.

## 2. Handling Data | ٢. بروتوكول التعامل مع البيانات
- **Public (عام):** No special handling required. / لا يتطلب بروتوكولات تعامل خاصة.
- **Internal (داخلي):** Must not be shared outside the company without permission. / يمنع مشاركتها خارج الشركة بدون إذن مسبق.
- **Confidential (سري):** Must be encrypted when stored or transmitted. Access is restricted. / يجب تشفيرها عند التخزين أو النقل ويتم تقييد الوصول إليها.
- **Restricted (محدود):** Must be encrypted. Access is strictly controlled on a need-to-know basis. / يجب تشفيرها ويخضع الوصول لرقابة مشددة وعلى أساس الحاجة القصوى للمعرفة فقط.
`,
            guideline: `
# Handling Company Data | إرشادات التعامل مع بيانات الشركة

## Know Your Data's Label | تعرف على ملصق تصنيف بياناتك
We label our data to know how sensitive it is. Look for labels like "Public," "Internal," or "Confidential."
نقوم بوضع ملصقات وتصنيفات لبياناتنا لتوضيح مدى حساسيتها. ابحث دائماً عن ملصقات مثل "عام" أو "داخلي" أو "سري".

## How to Handle It | كيف تتعامل معها
- **Public (عام):** Share freely! / شاركها بحرية تامة!
- **Internal (داخلي):** Keep it within the company. / احتفظ بها داخل بيئة عمل الشركة فقط.
- **Confidential/Restricted (سري أو محدود):** This is sensitive stuff. Make sure it's encrypted and be very careful who you share it with. If in doubt, ask your manager. / هذه بيانات حساسة للغاية. تأكد من تشفيرها وكن حريصاً جداً عند مشاركتها. إذا ساورك الشك، اسأل مديرك المباشر.
`
        }
    }
];
