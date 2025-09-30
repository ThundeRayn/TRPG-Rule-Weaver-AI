import Conversation from "@/Components/Conversation";
import Sidebar from "../../Components/Sidebar"

const Chatbot = () => {


  return (
    <div className="flex h-screen overflow-hidden bg-[var(--primary-color)] text-[var(--primary-text-color)]">
        <Sidebar />

        <main className="flex-1 flex-col pt-6 overflow-y-auto">
            <div className="h-full flex flex-col">
                {/* Header */}
                <h1 className="p-4 text-center text-2xl font-bold">
                    Rule-Weaver AI Assistant
                </h1>

                {/* Chat Interface */}
                <h2 className="text-xl font-bold pl-5">Step 1: Create your character</h2>
                <div className="h-[460px] p-5">
                    <Conversation />
                </div>
            </div>
        </main>
    </div>
    
  );
};

export default Chatbot;
