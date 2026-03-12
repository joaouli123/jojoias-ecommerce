import codecs

with codecs.open('src/components/layout/footer.tsx', 'r', encoding='utf-8-sig') as f:
    content = f.read()

# Make sure we add import
import_menu = 'import { FooterMenus } from "@/components/layout/footer-menus"\n'
if import_menu not in content:
    content = content.replace('import { WhatsAppIcon } from "@/components/ui/icons"', 'import { WhatsAppIcon } from "@/components/ui/icons"\n' + import_menu)

# Replace the bg color
content = content.replace('bg-[#FCFCFC]', 'bg-[#F9F8F6] pb-24') # Add pb-24 for whatsapp space

# Replace old links container with `<FooterMenus />`
start_marker = "{/* Links Columns */}"

# Find end of Legal block
end_legal = content.find('</ul>\n            </div>', content.find('Legal'))
if end_legal != -1:
    end_legal += len('</ul>\n            </div>')

    old_links_block = content[content.find(start_marker):end_legal]
    content = content.replace(old_links_block, start_marker + '\n            <FooterMenus />')

# Update Trust badges
content = content.replace('className="h-20 sm:h-24 w-auto object-contain mix-blend-multiply opacity-90 grayscale hover:grayscale-0 transition-all duration-300"', 'className="h-24 sm:h-28 w-auto object-contain mix-blend-multiply transition-all duration-300"')
content = content.replace('className="h-14 sm:h-12 w-auto object-contain mix-blend-multiply opacity-90 grayscale hover:grayscale-0 transition-all duration-300"', 'className="h-20 sm:h-16 w-auto object-contain mix-blend-multiply transition-all duration-300"')

# Fix contact column texts
content = content.replace('text-zinc-950', 'text-[#1A1A1A]')
content = content.replace('text-zinc-600', 'text-[#666666]')
content = content.replace('text-zinc-500', 'text-[#666666]')
content = content.replace('text-zinc-900', 'text-[#1A1A1A]')

with codecs.open('src/components/layout/footer.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
