-- ============================================================
-- 03: CONFIGURAÇÕES DO SISTEMA & PREÇOS (SUPABASE)
-- Restaura preços de documentos, chave Pix, domínios e tema visual
-- ============================================================

<USER_REQUEST>
INSERT INTO public.configuracoes (chave, valor) VALUES ('atestado_price', '15.00'), ('cnh_price', '25.00'), ('crlv_price', '20.00'), ('diploma_price', '20.00'), ('dominioApp', 'https://app-cnh-brasil.vercel.app'), ('dominioPainel', 'http://painel-mg-editaveis.com'), ('dominioQrAtestado', 'https://validar-atestado.vercel.app'), ('dominioQrCode', 'https://validar-cnh-brasil.vercel.app'), ('dut_price', '20.00'), ('exame_price', '20.00'), ('min_recharge', '20.00'), ('pix_key', 'admin@mgeditaveis.com.br'), ('prontuario_price', '10.00'), ('ref_bonus_indicado', '20.00'), ('ref_bonus_indicador', '40.00'), ('ref_min_deposit', '20.00'), ('rg_price', '20.00'), ('unimed_price', '15.00'), ('webapp_customization', '{"heroBanner":"uploads/logos/hero_banner.jpg?v=1793830026","logoImage":"uploads/logos/logo_webapp.png?v=1793830026","govHeaderLogo":"uploads/logos/logo_gov.png?v=1793830026","footerSerproImg":"uploads/logos/footer_serpro.png?v=1793830026","footerCnhImg":"uploads/logos/footer_cnh.png?v=1793830026","footerMinisterioImg":"uploads/logos/footer_ministerio.png?v=1793830026","logoText":"CNH","logoSub":"Do Brasil","pwaTitle":"CNH do Brasil","pwaSub":"Adicione à tela inicial","pwaBtnText":"Instalar","flowMode":"smart","updateTitle":"APP ATUALIZADOAPP CNH DO BRASIL","downloadUrl":"#","downloadBtnText":"BAIXAR NOVA VERSÃO","groupUrl":"https://chat.whatsapp.com/J0FvvNpoL7SHodR4ISMbyP?s=cl&p=a&iam=2","groupTitle":"Networking MG Editáveis","btnText":"ENTRAR COM GOV.BR","btnColor":"#255ab8"}');
</USER_REQUEST>
<ADDITIONAL_METADATA>
The current local time is: 2026-11-12T19:27:13-03:00.
</ADDITIONAL_METADATA>
ON CONFLICT (chave) DO UPDATE SET
    valor = EXCLUDED.valor;

-- Conferência rápida
SELECT chave, valor FROM public.configuracoes ORDER BY chave;
