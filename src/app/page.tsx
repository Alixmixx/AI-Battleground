"use client";
import { useRouter } from "next/navigation";
import { Typography, Button, Layout } from "antd";
import styled from "styled-components";

const { Title, Paragraph } = Typography;
const { Content } = Layout;

const StyledContent = styled(Content)`
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
`;

const StyledContainer = styled.div`
`;

const StyledButton = styled(Button)`
`;

export default function Home() {
    const router = useRouter();

    const enterBattleground = () => {
        router.push("/menu");
    };

    return (
        <StyledContent>
            <StyledContainer>
                <Title
                    level={1}
                    style={{
                        color: "var(--color-tekken-text)",
                        fontWeight: 700,
                        letterSpacing: "3px",
                        textShadow: "0 0 5px var(--color-tekken-accent)",
                        marginBottom: "1rem",
                    }}
                >
                    AI BATTLEGROUND
                </Title>
                <Paragraph
                    style={{
                        fontSize: "1.125rem",
                        marginBottom: "1.5rem",
                        color: "var(--color-tekken-text)",
                    }}
                >
                    CUTE AI, EPIC BATTLES - READY TO RUMBLE?
                </Paragraph>
                <StyledButton onClick={enterBattleground}>ENTER BATTLEGROUND</StyledButton>
            </StyledContainer>
        </StyledContent>
    );
}
