"use client";
import { useRouter } from "next/navigation";
import { Typography, Button, Layout, Space } from "antd";

const { Title, Paragraph } = Typography;
const { Content } = Layout;

export default function Home() {
    const router = useRouter();

    const enterBattleground = () => {
        router.push("/menu");
    };

    return (
        <Content
            style={{
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
            }}
        >
            <Space direction="vertical" align="center">
                <Title
                    level={1}
                >
                    AI BATTLEGROUND
                </Title>
                <Paragraph
                >
                    CUTE AI, EPIC BATTLES - READY TO RUMBLE?
                </Paragraph>
                <Button type="primary" size="large" onClick={enterBattleground}>
                    ENTER BATTLEGROUND
                </Button>
            </Space>
        </Content>
    );
}
