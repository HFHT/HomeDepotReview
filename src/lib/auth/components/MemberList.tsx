import { Avatar, CloseButton, Combobox, Group, InputBase, Text, useCombobox } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import { useAuthStore } from "../stores/authStore";
import { useState } from "react";
import { AzureADMember } from "../config/msalConfig";

/**
 * A searchable combobox component for selecting an Azure AD (Entra ID) organization member.
 *
 * @remarks
 * This component is part of the Microsoft authentication service. It reads the list of
 * organization members from the {@link useAuthStore} Zustand store (populated via Microsoft
 * Graph API) and renders a filterable, single-select dropdown.
 *
 * Members can be searched by display name or email address. Results are case-insensitive
 * and limited to the first 50 matches for performance. A clear button is shown when a
 * value is present, allowing the user to reset the selection.
 *
 * @example
 * ```tsx
 * <MemberList />
 * ```
 *
 * @returns The rendered member selection combobox.
 */
export function MemberList() {
    /** Mantine combobox controller managing dropdown open/close state. */
    const combobox = useCombobox();

    /** Azure AD members retrieved from Microsoft Graph, sourced from the auth store. */
    const { members } = useAuthStore();

    /** Current free-text search query entered by the user. */
    const [memberSearch, setMemberSearch] = useState('');

    /** The currently selected Azure AD member, or `undefined` if none is selected. */
    const [selectedMember, setSelectedMember] = useState<AzureADMember | undefined>(undefined);

    /**
     * Members filtered by the current search query.
     *
     * @remarks
     * Matches against both `displayName` and `mail` (case-insensitive). When the search
     * query is empty, all members are returned.
     */
    const filteredMembers = (members ?? []).filter(
        (m) =>
            !memberSearch ||
            m.displayName.toLowerCase().includes(memberSearch.toLowerCase()) ||
            m.mail?.toLowerCase().includes(memberSearch.toLowerCase())
    );

    /**
     * The string displayed in the input field.
     *
     * @remarks
     * When a member is selected, shows `"Display Name (email)"`. Otherwise, falls back
     * to the raw search query.
     */
    const displayValue = selectedMember?.displayName
        ? `${selectedMember.displayName} (${selectedMember.mail ?? ''})`
        : memberSearch;

    /**
     * Clears the current selection and search query, and closes the dropdown.
     *
     * @returns void
     */
    const handleClear = () => {
        setSelectedMember(undefined);
        setMemberSearch('');
        combobox.closeDropdown();
    };

    return (
        <div>
            <Text fw={600} mb={4}>
                Owner (Azure AD Member) *
            </Text>
            <Combobox
                store={combobox}
                onOptionSubmit={(val) => {
                    const m = members?.find((x) => x.id === val);
                    if (m) setSelectedMember(m);
                    combobox.closeDropdown();
                }}
            >
                <Combobox.Target>
                    <InputBase
                        leftSection={<IconSearch size={16} />}
                        rightSection={
                            displayValue ? (
                                <CloseButton
                                    size="sm"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={handleClear}
                                    aria-label="Clear selection"
                                />
                            ) : null
                        }
                        rightSectionPointerEvents={displayValue ? 'auto' : 'none'}
                        placeholder="Search by name or email…"
                        value={displayValue}
                        onChange={(e) => {
                            setMemberSearch(e.currentTarget.value);
                            setSelectedMember(undefined);
                            combobox.openDropdown();
                        }}
                        onClick={() => combobox.openDropdown()}
                        onFocus={() => combobox.openDropdown()}
                    />
                </Combobox.Target>
                <Combobox.Dropdown>
                    <Combobox.Options mah={240} style={{ overflowY: 'auto' }}>
                        {filteredMembers.length === 0 ? (
                            <Combobox.Empty>No members found</Combobox.Empty>
                        ) : (
                            filteredMembers.slice(0, 50).map((m) => (
                                <Combobox.Option value={m.id} key={m.id}>
                                    <Group gap="xs">
                                        <Avatar size="sm" color="habitatGreen">
                                            {m.displayName?.[0] ?? '?'}
                                        </Avatar>
                                        <div>
                                            <Text size="sm" fw={500}>
                                                {m.displayName}
                                            </Text>
                                            <Text size="xs" c="dimmed">
                                                {m.mail}
                                            </Text>
                                        </div>
                                    </Group>
                                </Combobox.Option>
                            ))
                        )}
                    </Combobox.Options>
                </Combobox.Dropdown>
            </Combobox>
        </div>
    );
}