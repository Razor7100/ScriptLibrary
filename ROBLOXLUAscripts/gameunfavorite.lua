local AvatarEditorService = game:GetService("AvatarEditorService")

local gameIDs = {
    123456789, -- Replace these with your actual favorite game IDs
    101010101,
}

local function promptFavorites()
    print("Starting to prompt all game favorites...")
    for _, id in ipairs(gameIDs) do
        print("Prompting favorite for game ID:", id)
        AvatarEditorService:PromptSetFavorite(id, Enum.AvatarItemType.Game, false)
        wait(10)
    end
    print("Finished prompting all game favorites.")
    wait(1)
end

promptFavorites()
