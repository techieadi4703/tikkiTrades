import CustomizableDashboard from "@/components/CustomizableDashboard";
import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { getDashboardWidgetOrder } from "@/lib/actions/preferences.actions";

const Home = async () => {
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    const userName = session?.user?.name || 'Trader';

    // Fetch persisted widget order
    const savedOrder = await getDashboardWidgetOrder();

    return (
        <CustomizableDashboard
            userName={userName}
            savedOrder={savedOrder.length > 0 ? savedOrder : undefined}
        />
    );
}

export default Home;