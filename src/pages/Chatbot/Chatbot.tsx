import Sidebar from "../../Components/Sidebar"

const Chatbot = () => {


  return (
    <div className="flex h-screen overflow-hidden">
        <Sidebar />


        <main className="flex-1 flex-col p-6 overflow-y-auto">
            <div className="h-screen flex flex-col">
                {/* Header */}
                <header className=" text-[var(--primary-text-color)] p-4 text-center text-2xl font-bold">
                    Rule-Weaver AI Assistant
                </header>

                {/* Chat Interface */}

            </div>
        </main>
    </div>
    
  );
};

export default Chatbot;
