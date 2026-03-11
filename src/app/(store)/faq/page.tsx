import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { InstitutionalHero } from "@/components/store/institutional-hero";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://luxijoias.com.br";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Veja as duvidas frequentes da JoJoias sobre pagamento, frete, trocas, devolucoes e acompanhamento de pedidos.",
  alternates: {
    canonical: "/faq",
  },
  openGraph: {
    title: "FAQ | JoJoias",
    description: "Veja as duvidas frequentes da JoJoias sobre pagamento, frete, trocas, devolucoes e acompanhamento de pedidos.",
    url: `${siteUrl}/faq`,
    type: "website",
    locale: "pt_BR",
  },
};

const faqs = [
  {
    question: "Quais formas de pagamento são aceitas?",
    answer: "Aceitamos Pix, cartão e outras modalidades configuradas no checkout. As opções disponíveis aparecem automaticamente conforme a integração ativa no painel.",
  },
  {
    question: "Como acompanho meu pedido?",
    answer: "Depois da compra, você pode acompanhar o status na sua conta e também receber atualizações por e-mail. Se precisar, nossa equipe ajuda pelo atendimento.",
  },
  {
    question: "Posso trocar ou devolver um produto?",
    answer: "Sim. Basta falar com a central dentro do prazo aplicável para receber as instruções. O fluxo completo também está detalhado na página de trocas e devoluções.",
  },
  {
    question: "Como calcular o frete antes da compra?",
    answer: "Na página do produto e no checkout, o cálculo é feito pelo CEP informado para mostrar prazo e valor antes da finalização.",
  },
  {
    question: "As peças possuem garantia?",
    answer: "Se houver divergência, defeito de fabricação ou necessidade de suporte pós-venda, nossa equipe orienta a análise e a solução adequada com agilidade.",
  },
];

export default function FaqPage() {
  return (
    <div className="bg-white">
      <InstitutionalHero
        eyebrow="FAQ"
        title="Dúvidas frequentes sobre pedidos, pagamentos e atendimento"
        description="Reunimos as respostas mais comuns para acelerar seu suporte e deixar a experiência de compra ainda mais simples."
      />

      <section className="mx-auto max-w-5xl px-6 py-16 sm:px-8 lg:px-10 lg:py-20">
        <div className="grid gap-4">
          {faqs.map((item) => (
            <div key={item.question} className="rounded-[20px] border border-zinc-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-zinc-950">{item.question}</h2>
              <p className="mt-3 text-sm leading-7 text-zinc-600">{item.answer}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-[20px] border border-zinc-200 bg-zinc-50 p-8">
          <h2 className="text-2xl font-bold text-zinc-950">Não encontrou sua resposta?</h2>
          <p className="mt-3 text-sm leading-7 text-zinc-600">Nossa central pode orientar sobre produtos, pedidos, pagamentos, trocas e prazos.</p>
          <Link href="/contato" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-zinc-900 hover:text-[#D4AF37]">
            Falar com o atendimento <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
