import { createSessionClient } from '@/lib/supabase/server';
import CopyableCode from '@/components/dashboard/CopyableCode';

export default async function EmbedCodePage() {
  const supabase = createSessionClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const { data: profile } = await supabase.from('profiles').select('clinic_id').eq('id', session!.user.id).single();

  const snippet = `<script src="${process.env.NEXT_PUBLIC_APP_URL}/embed.js" data-clinic-id="${profile!.clinic_id}" async></script>`;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900 mb-2">Embed your AI assistant</h1>
      <p className="text-slate-500 mb-6">
        Paste this one line before the closing <code>&lt;/body&gt;</code> tag on your website.
      </p>
      <CopyableCode code={snippet} />
    </div>
  );
      }
