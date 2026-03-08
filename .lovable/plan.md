
Objetivo: corrigir de forma definitiva o upload para não cair no Drive pessoal e eliminar o erro `storageQuotaExceeded`.

1) Diagnóstico confirmado
- A pasta raiz atual (`GOOGLE_DRIVE_ROOT_FOLDER_ID`) está no Drive pessoal (você confirmou).
- O código hoje reutiliza pastas já salvas em `drive_folders`; se uma pasta antiga foi criada no Drive pessoal, ela continua sendo usada e o upload falha com quota da Service Account.

2) Correção de configuração (obrigatória)
- Criar (ou escolher) uma pasta dentro de um Drive Compartilhado.
- Garantir que o e-mail da Service Account tenha papel de “Gerente de conteúdo” (ou maior) nesse Drive Compartilhado.
- Atualizar `GOOGLE_DRIVE_ROOT_FOLDER_ID` com o ID dessa pasta (não do Drive pessoal).

3) Reforço no backend function (validação forte)
- Arquivo: `supabase/functions/google-drive/index.ts`
- Manter validação da pasta raiz e endurecer com checagens adicionais:
  - Validar `rootFolderId` em toda requisição (`mimeType`, `trashed`, `driveId` obrigatório).
  - Ao ler pasta de cliente já existente no banco, validar metadados dessa pasta também:
    - se `driveId` diferente do da raiz compartilhada, ou pasta inválida/na lixeira → descartar essa referência e recriar pasta correta sob a raiz compartilhada.
  - Fazer o mesmo para pasta mensal antes de upload.
- Resultado: mesmo com registros antigos “contaminados”, o fluxo se auto-corrige para Shared Drive.

4) Ajuste de consulta para evitar reutilizar pasta errada
- Na busca de pasta “client” em `drive_folders`, filtrar também por `parent_folder_id = rootFolderId` (além de `user_id` + `folder_type`).
- Se não achar, criar nova pasta corretamente sob a raiz compartilhada.
- Isso evita pegar pasta antiga do Drive pessoal.

5) Higiene de dados legados (sem mudar schema)
- Limpar/reclassificar registros antigos de `drive_folders` que apontam para raiz pessoal (operação de dados).
- Não é obrigatório para funcionar após as validações, mas reduz risco de confusão futura.

6) Validação final (fim-a-fim)
- Testar upload via `/admin/videos` com arquivo >5MB (caminho resumable) e <5MB (multipart).
- Confirmar:
  - pasta cliente e pasta mês criadas no Drive Compartilhado;
  - `videos.drive_file_id` preenchido;
  - links de visualização/download válidos;
  - sem erro 500/403.

Detalhes técnicos
- Causa raiz: Service Account não possui quota própria em “Meu Drive”; upload só funciona com Shared Drive.
- Ponto crítico no código: fallback para pasta existente em `drive_folders` sem validar se pertence ao mesmo `driveId` da raiz atual.
- Escopo de implementação:
  - principal: `supabase/functions/google-drive/index.ts`
  - opcional (UX): `src/components/VideoUploadDialog.tsx` apenas para mensagem mais clara quando erro de configuração ocorrer.
